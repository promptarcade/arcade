extends Control

## Visual bar showing the balance between light and corruption.

func _draw() -> void:
	var main = get_tree().current_scene
	if not main or not main.has_method("_update_ui"):
		return

	var ratio = main.luminance_ratio
	var bar_width = size.x
	var bar_height = size.y

	# Background
	draw_rect(Rect2(0, 0, bar_width, bar_height), Color(0.1, 0.1, 0.15, 0.6))

	# Healthy portion (left, cyan/green)
	var healthy_width = bar_width * ratio
	if healthy_width > 0:
		var healthy_col = Color(0.2, 0.7, 0.8, 0.7)
		draw_rect(Rect2(0, 0, healthy_width, bar_height), healthy_col)

	# Corrupted portion (right, red/magenta)
	var corrupt_width = bar_width * (1.0 - ratio)
	if corrupt_width > 0:
		var corrupt_col = Color(0.7, 0.15, 0.25, 0.7)
		draw_rect(Rect2(healthy_width, 0, corrupt_width, bar_height), corrupt_col)

	# Border
	draw_rect(Rect2(0, 0, bar_width, bar_height), Color(0.3, 0.4, 0.5, 0.4), false, 1.0)

	# Threshold markers
	var win_x = bar_width * (main.WIN_LUMINANCE / 100.0)
	var lose_x = bar_width * (main.LOSE_LUMINANCE / 100.0)
	draw_line(Vector2(win_x, 0), Vector2(win_x, bar_height), Color(0.3, 1.0, 0.5, 0.3), 1.0)
	draw_line(Vector2(lose_x, 0), Vector2(lose_x, bar_height), Color(1.0, 0.3, 0.3, 0.3), 1.0)
