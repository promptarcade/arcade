extends Node2D
class_name Organism

## A living light organism that grows, pulses, and spreads.
## Healthy organisms near corrupted ones slowly reclaim them.

enum State { SEED, GROWING, MATURE, CORRUPTED, DEAD }

@export var base_color: Color = Color(0.2, 0.8, 1.0)
@export var growth_rate: float = 0.3
@export var max_radius: float = 40.0
@export var spread_chance: float = 0.008
@export var spread_range: float = 120.0
@export var pulse_speed: float = 2.0

var state: State = State.SEED
var radius: float = 2.0
var energy: float = 1.0
var age: float = 0.0
var pulse_phase: float = 0.0
var corruption: float = 0.0  # 0 = healthy, 1 = fully corrupt
var health: float = 1.0  # for reclamation: healthy neighbors push this up
var connections: Array[Organism] = []

# Visual properties
var glow_intensity: float = 0.0
var target_glow: float = 1.0
var tendrils: Array[Dictionary] = []
var death_fade: float = 1.0  # fades to 0 when dying

signal organism_spread(pos: Vector2, color: Color)
signal organism_corrupted(organism: Organism)
signal organism_died(organism: Organism)


func _ready() -> void:
	pulse_phase = randf() * TAU
	growth_rate *= randf_range(0.8, 1.2)
	max_radius *= randf_range(0.8, 1.2)
	var tendril_count = randi_range(3, 6)
	for i in tendril_count:
		var angle = (TAU / tendril_count) * i + randf_range(-0.3, 0.3)
		tendrils.append({
			"angle": angle,
			"length": 0.0,
			"max_length": randf_range(0.5, 1.5),
			"speed": randf_range(0.3, 0.8),
			"wave_offset": randf() * TAU
		})


func _process(delta: float) -> void:
	age += delta
	pulse_phase += delta * pulse_speed

	match state:
		State.SEED:
			_process_seed(delta)
		State.GROWING:
			_process_growing(delta)
		State.MATURE:
			_process_mature(delta)
		State.CORRUPTED:
			_process_corrupted(delta)
		State.DEAD:
			_process_dead(delta)

	glow_intensity = lerp(glow_intensity, target_glow, delta * 3.0)
	queue_redraw()


func _process_seed(delta: float) -> void:
	target_glow = 0.3 + sin(pulse_phase * 3.0) * 0.2
	if age > 0.5:
		state = State.GROWING


func _process_growing(delta: float) -> void:
	radius = min(radius + growth_rate * delta * 10.0, max_radius)
	energy = radius / max_radius
	target_glow = 0.5 + energy * 0.5 + sin(pulse_phase) * 0.1

	for t in tendrils:
		if t.length < t.max_length:
			t.length = min(t.length + t.speed * delta, t.max_length)

	if radius >= max_radius * 0.95:
		state = State.MATURE


func _process_mature(delta: float) -> void:
	target_glow = 0.8 + sin(pulse_phase) * 0.15
	energy = 1.0 + sin(pulse_phase * 0.5) * 0.1

	# Chance to spread
	if randf() < spread_chance * (1.0 - corruption):
		_try_spread()

	# Healthy mature organisms reclaim nearby corrupted ones
	_try_reclaim(delta)


func _process_corrupted(delta: float) -> void:
	corruption = min(corruption + delta * 0.05, 1.0)
	target_glow = 0.3 + sin(pulse_phase * 4.0) * 0.2 * (1.0 - corruption)
	pulse_speed = lerp(2.0, 6.0, corruption)
	energy = max(energy - delta * 0.02, 0.1)

	# Check for reclamation by healthy neighbors
	_check_reclamation(delta)

	# Spread corruption to neighbors
	if corruption > 0.3 and randf() < spread_chance * 0.5:
		_try_spread_corruption()

	# Fully corrupted organisms eventually die
	if corruption >= 1.0:
		health -= delta * 0.1
		if health <= 0.0:
			state = State.DEAD
			death_fade = 1.0


func _process_dead(delta: float) -> void:
	death_fade = max(death_fade - delta * 0.5, 0.0)
	target_glow = 0.05 * death_fade
	if death_fade <= 0.0:
		organism_died.emit(self)
		queue_free()


func _try_spread() -> void:
	var angle = randf() * TAU
	var dist = randf_range(spread_range * 0.5, spread_range)
	var spread_pos = global_position + Vector2(cos(angle), sin(angle)) * dist
	var child_color = base_color
	child_color.h += randf_range(-0.05, 0.05)
	child_color.s = clamp(child_color.s + randf_range(-0.1, 0.1), 0.5, 1.0)
	organism_spread.emit(spread_pos, child_color)


func _try_spread_corruption() -> void:
	var nearby = _find_nearby_organisms()
	for other in nearby:
		if other.state != State.CORRUPTED and other.state != State.DEAD:
			# Corruption chance decreases with more healthy neighbors the target has
			var target_healthy_neighbors = other.count_healthy_neighbors()
			var resist = target_healthy_neighbors * 0.15  # each healthy neighbor gives 15% resistance
			if randf() > resist:
				other.start_corruption()


func _try_reclaim(delta: float) -> void:
	# Mature healthy organisms push back corruption on neighbors
	var nearby = _find_nearby_organisms()
	for other in nearby:
		if other.state == State.CORRUPTED:
			# Push health into the corrupted neighbor
			other.receive_healing(delta * 0.3)


func _check_reclamation(delta: float) -> void:
	# If enough healthy neighbors, corruption can be reversed
	var healthy_count = count_healthy_neighbors()
	if healthy_count >= 3:
		# Strong reclamation — surrounded by health
		health += delta * 0.2 * (healthy_count - 2)
		if health >= 1.0:
			_reclaim()
	elif healthy_count >= 1:
		# Slow resistance — not enough to reclaim but slows corruption
		corruption = max(corruption - delta * 0.01 * healthy_count, 0.0)


func receive_healing(amount: float) -> void:
	if state == State.CORRUPTED:
		health += amount
		if health >= 1.0:
			_reclaim()


func _reclaim() -> void:
	state = State.MATURE
	corruption = 0.0
	health = 1.0
	pulse_speed = 2.0
	energy = 0.5  # starts weak after reclamation
	# Brief bright flash — visual feedback
	glow_intensity = 2.0


func count_healthy_neighbors() -> int:
	var count = 0
	var nearby = _find_nearby_organisms()
	for other in nearby:
		if other.state == State.MATURE or other.state == State.GROWING:
			count += 1
	return count


func _find_nearby_organisms() -> Array:
	var result: Array = []
	var organisms = get_tree().get_nodes_in_group("organisms")
	for org in organisms:
		if org != self and org is Organism:
			var dist = global_position.distance_to(org.global_position)
			if dist < spread_range:
				result.append(org)
	return result


func start_corruption() -> void:
	if state == State.CORRUPTED or state == State.DEAD:
		return
	state = State.CORRUPTED
	health = 0.7  # starts with some health — can still be saved
	organism_corrupted.emit(self)


func connect_to(other: Organism) -> void:
	if other not in connections:
		connections.append(other)


func is_healthy() -> bool:
	return state == State.MATURE or state == State.GROWING or state == State.SEED


func get_display_color() -> Color:
	var c = base_color
	if corruption > 0:
		var corrupt_color = Color(0.8, 0.1, 0.3)
		c = c.lerp(corrupt_color, corruption * 0.7)
		c *= 1.0 + sin(pulse_phase * 4.0 + age) * corruption * 0.5
	if state == State.DEAD:
		c *= death_fade
	return c * glow_intensity * energy


func _draw() -> void:
	var col = get_display_color()
	var draw_radius = radius
	if state == State.DEAD:
		draw_radius *= death_fade

	# Core glow layers
	var layers = 5
	for i in range(layers, 0, -1):
		var t = float(i) / float(layers)
		var r = draw_radius * (0.3 + t * 0.7)
		var alpha = (1.0 - t) * 0.6
		var layer_col = col
		layer_col.r *= 1.5 + (1.0 - t) * 2.0
		layer_col.g *= 1.5 + (1.0 - t) * 2.0
		layer_col.b *= 1.5 + (1.0 - t) * 2.0
		layer_col.a = alpha
		draw_circle(Vector2.ZERO, r, layer_col)

	# Bright core
	var core_col = Color.WHITE if state != State.CORRUPTED else Color(1, 0.5, 0.5)
	core_col.a = glow_intensity * 0.9
	if state == State.DEAD:
		core_col.a *= death_fade
	draw_circle(Vector2.ZERO, draw_radius * 0.15, core_col)

	# Tendrils
	if state != State.SEED and state != State.DEAD:
		for t in tendrils:
			_draw_tendril(t, col)

	# Connection lines
	for other in connections:
		if is_instance_valid(other) and other.state != State.DEAD:
			_draw_connection(other, col)

	# Reclamation indicator — bright ring when being healed
	if state == State.CORRUPTED and health > 0.7:
		var heal_alpha = (health - 0.7) / 0.3
		var heal_col = Color(0.3, 1.0, 0.5, heal_alpha * 0.5)
		heal_col.r *= 2.0
		heal_col.g *= 2.0
		heal_col.b *= 2.0
		draw_arc(Vector2.ZERO, draw_radius * 1.2, 0, TAU * health, 32, heal_col, 2.0)


func _draw_tendril(t: Dictionary, col: Color) -> void:
	var length = t.length * radius
	var angle = t.angle + sin(pulse_phase + t.wave_offset) * 0.2
	var segments = 8
	var prev = Vector2.ZERO

	for i in range(1, segments + 1):
		var frac = float(i) / float(segments)
		var wave = sin(pulse_phase * 2.0 + frac * 4.0 + t.wave_offset) * frac * 6.0
		var dir = Vector2(cos(angle), sin(angle))
		var perp = Vector2(-dir.y, dir.x)
		var point = dir * length * frac + perp * wave

		var width = (1.0 - frac) * 2.0
		var tendril_col = col
		tendril_col.a = (1.0 - frac) * 0.4 * glow_intensity
		tendril_col.r *= 1.2
		tendril_col.g *= 1.2
		tendril_col.b *= 1.2
		draw_line(prev, point, tendril_col, width, true)
		prev = point


func _draw_connection(other: Organism, col: Color) -> void:
	var to_other = other.global_position - global_position
	var dist = to_other.length()
	if dist > spread_range * 1.2:
		connections.erase(other)
		return

	# Connections between healthy organisms glow. Mixed connections dim.
	var connection_health = 1.0
	if state == State.CORRUPTED or other.state == State.CORRUPTED:
		connection_health = 0.3

	var segments = 12
	var prev_point = Vector2.ZERO
	for i in range(1, segments + 1):
		var frac = float(i) / float(segments)
		var point = to_other * frac
		var perp = Vector2(-to_other.y, to_other.x).normalized()
		point += perp * sin(pulse_phase + frac * TAU) * 8.0

		var line_col = col
		var fade = sin(frac * PI)
		line_col.a = fade * 0.15 * glow_intensity * connection_health
		line_col.r *= 1.3
		line_col.g *= 1.3
		line_col.b *= 1.3
		draw_line(prev_point, point, line_col, 1.5, true)
		prev_point = point
