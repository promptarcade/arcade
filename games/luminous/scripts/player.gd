extends Node2D

## The player — a bright spark that moves through the dark and places seeds of light.
## Gains energy from nearby healthy organisms. Spends energy to place seeds.

@export var move_speed: float = 200.0
@export var glow_radius: float = 12.0
@export var trail_rate: float = 0.03

# Energy system
var energy: float = 50.0
var max_energy: float = 100.0
var energy_gain_rate: float = 8.0  # per second when near healthy organisms
var seed_cost: float = 15.0
var energy_gain_range: float = 150.0  # how close to organisms to gain energy
var energy_drain_rate: float = 1.0  # passive drain — the dark costs

var pulse_phase: float = 0.0
var trail_points: Array[Dictionary] = []
var max_trail: int = 40
var trail_timer: float = 0.0
var velocity: Vector2 = Vector2.ZERO
var nearby_healthy: int = 0  # how many healthy organisms are close

signal place_seed(pos: Vector2)
signal energy_changed(current: float, maximum: float)
signal player_died()


func _process(delta: float) -> void:
	pulse_phase += delta * 5.0

	# Movement
	var input = Vector2.ZERO
	input.x = Input.get_axis("move_left", "move_right")
	input.y = Input.get_axis("move_up", "move_down")

	if input.length() > 0:
		input = input.normalized()
		velocity = velocity.lerp(input * move_speed, delta * 8.0)
	else:
		velocity = velocity.lerp(Vector2.ZERO, delta * 5.0)

	position += velocity * delta

	# Energy: gain from nearby healthy organisms, drain passively
	_update_energy(delta)

	# Trail
	trail_timer += delta
	if trail_timer >= trail_rate and velocity.length() > 10.0:
		trail_timer = 0.0
		trail_points.append({
			"pos": position,
			"age": 0.0,
			"max_age": randf_range(0.4, 0.8)
		})
		if trail_points.size() > max_trail:
			trail_points.pop_front()

	# Age trail points
	var to_remove: Array[int] = []
	for i in range(trail_points.size()):
		trail_points[i].age += delta
		if trail_points[i].age >= trail_points[i].max_age:
			to_remove.append(i)
	to_remove.reverse()
	for i in to_remove:
		trail_points.remove_at(i)

	# Place seed on click
	if Input.is_action_just_pressed("place_seed"):
		_try_place_seed()

	queue_redraw()


func _update_energy(delta: float) -> void:
	# Count nearby healthy organisms
	nearby_healthy = 0
	var organisms = get_tree().get_nodes_in_group("organisms")
	for org in organisms:
		if org is Organism and org.state != Organism.State.CORRUPTED:
			var dist = global_position.distance_to(org.global_position)
			if dist < energy_gain_range:
				# More energy from mature, less from seeds/growing
				var multiplier = org.energy if org.state == Organism.State.MATURE else org.energy * 0.3
				nearby_healthy += 1
				energy += energy_gain_rate * multiplier * delta / (1.0 + dist / energy_gain_range)

	# Passive drain — the dark erodes
	energy -= energy_drain_rate * delta

	# Nearby corruption drains faster
	for org in organisms:
		if org is Organism and org.state == Organism.State.CORRUPTED:
			var dist = global_position.distance_to(org.global_position)
			if dist < energy_gain_range:
				energy -= org.corruption * 2.0 * delta / (1.0 + dist / energy_gain_range)

	energy = clamp(energy, 0.0, max_energy)
	energy_changed.emit(energy, max_energy)

	# Death check
	if energy <= 0.0:
		player_died.emit()


func _try_place_seed() -> void:
	if energy < seed_cost:
		return
	var mouse_pos = get_global_mouse_position()
	energy -= seed_cost
	energy_changed.emit(energy, max_energy)
	place_seed.emit(mouse_pos)


func can_afford_seed() -> bool:
	return energy >= seed_cost


func _draw() -> void:
	var energy_frac = energy / max_energy

	# Trail
	for t in trail_points:
		var life = 1.0 - (t.age / t.max_age)
		var local_pos = t.pos - position
		var trail_col = Color(0.5, 0.9, 1.0, life * 0.3 * energy_frac)
		trail_col.r *= 1.5
		trail_col.g *= 1.5
		trail_col.b *= 1.5
		draw_circle(local_pos, glow_radius * 0.3 * life, trail_col)

	# Outer glow layers — dim with low energy
	var layers = 6
	for i in range(layers, 0, -1):
		var t = float(i) / float(layers)
		var r = glow_radius * (0.2 + t * 0.8)
		var pulse = sin(pulse_phase) * 0.1 + 1.0
		var alpha = (1.0 - t) * 0.5 * pulse * (0.3 + energy_frac * 0.7)
		var col = Color(0.6, 0.95, 1.0, alpha)
		# HDR for bloom — scales with energy
		var hdr = (2.0 + (1.0 - t) * 3.0) * (0.4 + energy_frac * 0.6)
		col.r *= hdr
		col.g *= hdr
		col.b *= hdr
		draw_circle(Vector2.ZERO, r * pulse, col)

	# Bright white core
	var core_pulse = 0.9 + sin(pulse_phase * 2.0) * 0.1
	draw_circle(Vector2.ZERO, glow_radius * 0.12, Color(1, 1, 1, core_pulse * energy_frac))

	# Orbiting sparks — fewer when low energy
	var spark_count = 3 if energy_frac > 0.3 else 1
	for i in range(spark_count):
		var orbit_angle = pulse_phase * (1.5 + i * 0.3) + i * TAU / 3.0
		var orbit_radius = glow_radius * (0.4 + sin(pulse_phase * 0.7 + i) * 0.1)
		var spark_pos = Vector2(cos(orbit_angle), sin(orbit_angle)) * orbit_radius
		var spark_col = Color(0.8, 0.95, 1.0, 0.6 * energy_frac)
		spark_col.r *= 2.0
		spark_col.g *= 2.0
		spark_col.b *= 2.0
		draw_circle(spark_pos, 1.5, spark_col)

	# Energy indicator ring — shows how full you are
	var ring_segments = 48
	var filled_segments = int(ring_segments * energy_frac)
	var ring_radius = glow_radius * 1.5
	for i in range(ring_segments):
		var angle_start = (TAU / ring_segments) * i - PI / 2.0
		var angle_end = (TAU / ring_segments) * (i + 1) - PI / 2.0
		var p1 = Vector2(cos(angle_start), sin(angle_start)) * ring_radius
		var p2 = Vector2(cos(angle_end), sin(angle_end)) * ring_radius
		var ring_col: Color
		if i < filled_segments:
			ring_col = Color(0.3, 0.8, 1.0, 0.4)
			if energy_frac < 0.25:
				# Flicker when low
				ring_col = Color(1.0, 0.3, 0.3, 0.4 + sin(pulse_phase * 8.0) * 0.3)
		else:
			ring_col = Color(0.2, 0.3, 0.4, 0.1)
		draw_line(p1, p2, ring_col, 1.5, true)
