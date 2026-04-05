using UnityEngine;
using System.Collections;

public class LoadScreen : MonoBehaviour {

	public string screen;

	public void OnMouseDown() {

		Application.LoadLevel (screen);
	}
}
