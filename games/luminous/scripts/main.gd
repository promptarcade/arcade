extends Node2D

## Main game controller — manages organisms, corruption, balance, and game state.

const MAX_ORGANISMS: int = 200
const MIN_SPAWN_DISTANCE: float = 30.0
const CONNECTION_DISTANCE: float = 150.0

# Win/lose thresholds
const WIN_LUMINANCE: float = 80.0  # percentage of healthy organisms to win
const LOSE_LUMINANCE: float = 20.0  # below this for too long = lose
const LOSE_TIMER_THRESHOLD: float = 10.0  # seconds below LOSE_LUMINANCE

@onready var player: Node2D = $Player
@onready var camera: Camera2D = $Camera2D
@onready var organisms_node: Node2D = $Organisms
@onready var ui: CanvasLayer = $UI
@onready var count_label: Label = $UI/CountLabel
@onready var energy_label: Label = $UI/EnergyLabel
@onready var balance_bar: Control = $UI/BalanceBar
@onready var message_label: Label = $UI/MessageLabel

var organism_count: int = 0
var corruption_started: bool = false
var corruption_timer: float = 0.0
var corruption_delay: float = 25.0
var corruption_wave: int = 0
var corruption_wave_timer: float = 0.0
var corruption_wave_interval: float = 40.0  # new corruption source every N seconds

var luminance_ratio: float = 1.0  # 0-1, healthy / total
var low_luminance_timer: float = 0.0
var game_over: bool = false
var game_won: bool = false
var total_reclaimed: int = 0
var peak_organisms: int = 0

# Color palettes
var palettes: Array[Color] = [
	Color(0.2, 0.8, 1.0),   # cyan
	Color(0.3, 1.0, 0.5),   # green
	Color(0.9, 0.7, 0.2),   # amber
	Color(0.7, 0.3, 1.0),   # purple
	Color(1.0, 0.4, 0.6),   # pink
]
var current_palette_index: int = 0


func _ready() -> void:
	player.place_seed.connect(_on_player_place_seed)
	player.energy_changed.connect(_on_energy_changed)
	player.player_died.connect(_on_player_died)
	# Starting garden
	_spawn_organism(Vector2(-60, 0), palettes[0])
	_spawn_organism(Vector2(60, 0), palettes[0])
	_spawn_organism(Vector2(0, -60), palettes[0])
	_show_message("grow your garden of light\nclick to plant seeds  •  WASD to move  •  1-5 change color", 6.0)


func _process(delta: float) -> void:
	if game_over or game_won:
		return

	# Camera follows player
	camera.position = camera.position.lerp(player.position, delta * 4.0)

	# Update connections
	_update_connections()

	# Track balance
	_update_balance(delta)

	# Corruption waves
	_update_corruption(delta)

	# Update UI
	_update_ui()


func _update_balance(delta: float) -> void:
	var healthy = 0
	var corrupted = 0
	var total = 0
	for org in organisms_node.get_children():
		if org is Organism and org.state != Organism.State.DEAD:
			total += 1
			if org.state == Organism.State.CORRUPTED:
				corrupted += 1
			else:
				healthy += 1

	peak_organisms = max(peak_organisms, total)

	if total > 0:
		luminance_ratio = float(healthy) / float(total)
	else:
		luminance_ratio = 0.0

	# Check lose condition — too much corruption for too long
	if corruption_started and total > 5:
		if luminance_ratio < LOSE_LUMINANCE / 100.0:
			low_luminance_timer += delta
			if low_luminance_timer >= LOSE_TIMER_THRESHOLD:
				_game_over_lose()
		else:
			low_luminance_timer = max(low_luminance_timer - delta * 2.0, 0.0)

		# Check win condition — overwhelming light
		if total >= 50 and luminance_ratio >= WIN_LUMINANCE / 100.0 and corruption_wave >= 3:
			_game_over_win()


func _update_corruption(delta: float) -> void:
	# Start corruption after delay
	if not corruption_started and organism_count > 8:
		corruption_timer += delta
		if corruption_timer >= corruption_delay:
			_start_corruption()
			_show_message("corruption has found your garden...", 4.0)

	# Corruption waves — new sources appear periodically
	if corruption_started and not game_over:
		corruption_wave_timer += delta
		if corruption_wave_timer >= corruption_wave_interval:
			corruption_wave_timer = 0.0
			corruption_wave += 1
			_spawn_corruption_wave()
			# Waves get faster
			corruption_wave_interval = max(corruption_wave_interval * 0.85, 15.0)


func _spawn_corruption_wave() -> void:
	# Pick 1-3 organisms far from player to corrupt
	var targets = _find_corruption_targets(1 + min(corruption_wave / 2, 2))
	for t in targets:
		t.start_corruption()
	if targets.size() > 0:
		_show_message("corruption spreads...", 2.0)


func _find_corruption_targets(count: int) -> Array[Organism]:
	var candidates: Array[Organism] = []
	for org in organisms_node.get_children():
		if org is Organism and org.is_healthy() and org.state == Organism.State.MATURE:
			candidates.append(org)

	# Sort by distance from player — corrupt the farthest
	candidates.sort_custom(func(a, b):
		return a.global_position.distance_to(player.position) > b.global_position.distance_to(player.position)
	)

	var result: Array[Organism] = []
	for i in range(min(count, candidates.size())):
		result.append(candidates[i])
	return result


func _on_player_place_seed(pos: Vector2) -> void:
	if game_over or game_won:
		return
	if organism_count >= MAX_ORGANISMS:
		return
	if not _can_place_at(pos):
		return

	var color = palettes[current_palette_index]
	color.h += randf_range(-0.03, 0.03)
	_spawn_organism(pos, color)


func _spawn_organism(pos: Vector2, color: Color) -> void:
	if organism_count >= MAX_ORGANISMS:
		return

	var org = Organism.new()
	org.position = pos
	org.base_color = color
	org.add_to_group("organisms")
	org.organism_spread.connect(_on_organism_spread)
	org.organism_corrupted.connect(_on_organism_corrupted)
	org.organism_died.connect(_on_organism_died)
	organisms_node.add_child(org)
	organism_count += 1


func _on_organism_spread(pos: Vector2, color: Color) -> void:
	if organism_count >= MAX_ORGANISMS:
		return
	if not _can_place_at(pos):
		return
	_spawn_organism(pos, color)


func _on_organism_corrupted(_org: Organism) -> void:
	pass


func _on_organism_died(org: Organism) -> void:
	organism_count -= 1


func _on_energy_changed(current: float, _maximum: float) -> void:
	if energy_label:
		energy_label.text = "energy: %d" % int(current)


func _on_player_died() -> void:
	_game_over_lose()


func _can_place_at(pos: Vector2) -> bool:
	for org in organisms_node.get_children():
		if org is Organism:
			if org.global_position.distance_to(pos) < MIN_SPAWN_DISTANCE:
				return false
	return true


func _update_connections() -> void:
	var organisms = organisms_node.get_children()
	if organisms.size() == 0:
		return
	var check_count = mini(organisms.size(), 10)
	for _i in range(check_count):
		var idx = randi() % organisms.size()
		var org = organisms[idx]
		if org is Organism:
			for other in organisms:
				if other is Organism and other != org:
					var dist = org.global_position.distance_to(other.global_position)
					if dist < CONNECTION_DISTANCE and other not in org.connections:
						org.connect_to(other)


func _start_corruption() -> void:
	corruption_started = true
	corruption_wave = 1
	var targets = _find_corruption_targets(1)
	for t in targets:
		t.start_corruption()


func _update_ui() -> void:
	if count_label:
		var healthy = 0
		var corrupted = 0
		for org in organisms_node.get_children():
			if org is Organism:
				if org.state == Organism.State.CORRUPTED:
					corrupted += 1
				elif org.state != Organism.State.DEAD:
					healthy += 1
		count_label.text = "living: %d" % healthy
		if corrupted > 0:
			count_label.text += "  corrupted: %d" % corrupted

	if balance_bar:
		balance_bar.queue_redraw()


func _show_message(text: String, duration: float) -> void:
	if message_label:
		message_label.text = text
		message_label.modulate.a = 1.0
		var tween = create_tween()
		tween.tween_interval(duration)
		tween.tween_property(message_label, "modulate:a", 0.0, 1.5)


func _game_over_lose() -> void:
	game_over = true
	_show_message("the darkness consumed your garden\n\npress R to try again", 999.0)


func _game_over_win() -> void:
	game_won = true
	_show_message("your light outgrew the corruption\n\nreclaimed: %d  •  peak: %d\n\npress R to play again" % [total_reclaimed, peak_organisms], 999.0)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		# Palette switching
		if event.keycode >= KEY_1 and event.keycode <= KEY_5:
			current_palette_index = event.keycode - KEY_1

		# Restart
		if event.keycode == KEY_R and (game_over or game_won):
			get_tree().reload_current_scene()
