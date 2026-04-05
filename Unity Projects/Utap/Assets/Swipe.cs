using UnityEngine;
using System.Collections;

public class Swipe : MonoBehaviour {
	
	Vector2 firstPressPos;
	Vector2 secondPressPos;
	Vector2 currentSwipe;
	
	// Update is called once per frame
	void Update () {
		DetectSwipe ();	
	}
	
	public void DetectSwipe()
	{
		//Mouse swipes
		if(Input.GetMouseButtonDown(0))
		{
			//save began touch 2d point
			firstPressPos = new Vector2(Input.mousePosition.x,Input.mousePosition.y);
		}
		if(Input.GetMouseButtonUp(0))
		{
			//save ended touch 2d point
			secondPressPos = new Vector2(Input.mousePosition.x,Input.mousePosition.y);
			
			//create vector from the two points
			currentSwipe = new Vector2(secondPressPos.x - firstPressPos.x, secondPressPos.y - firstPressPos.y);
			
			//normalize the 2d vector
			currentSwipe.Normalize();

			//swipe right
			if(currentSwipe.x > 0 && currentSwipe.x < 1 && currentSwipe.y > -0.5f  && currentSwipe.y < 0.5f)
			{
				Application.LoadLevel ("Selections");
			}
		}
		//Touch screen swipes
		if(Input.touches.Length > 0)
		{
			Touch t = Input.GetTouch(0);
			if(t.phase == TouchPhase.Began)
			{
				//save began touch 2d point
				firstPressPos = new Vector2(t.position.x,t.position.y);
			}
			if(t.phase == TouchPhase.Ended)
			{
				//save ended touch 2d point
				secondPressPos = new Vector2(t.position.x,t.position.y);
				
				//create vector from the two points
				currentSwipe = new Vector3(secondPressPos.x - firstPressPos.x, secondPressPos.y - firstPressPos.y);
				
				//normalize the 2d vector
				currentSwipe.Normalize();

				//swipe right
				if(currentSwipe.x > 0  && currentSwipe.y > -0.5f  && currentSwipe.y < 0.5f)
				{
					Application.LoadLevel ("Selections");
				}
			}
		}
	}
}
