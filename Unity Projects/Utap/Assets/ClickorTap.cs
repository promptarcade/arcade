using UnityEngine;
using System.Collections;

public class ClickorTap : MonoBehaviour {
	
	public AudioSource source;
	
	public void OnMouseDown ()  {

		if (source.isPlaying) {

			source.Stop();

		} 

		else {

			source.Play ();	
		}

	}
}