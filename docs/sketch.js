
let x;
let y;

function setup() {
  x=0
  createCanvas(900, 700);
  background(0 ,90 ,190);
  fill(190, 0, 0);
  textSize(30);
  text('Paint with MIDDLE button, erase with LEFT button', 70, 50)
}

function draw() {
  if(x==1){
    fill(0, 90, 190);
    noStroke();
    ellipse(mouseX, mouseY, 30, 30);
  }
  if(y==1){
    fill(50, 220, 50);
    noStroke();
    ellipse(mouseX, mouseY, 30, 30);
  }
}

function mousePressed(){
  if(mouseButton==LEFT){
    x=1;
  }
  if(mouseButton==CENTER){
    y=1
  }
}

function mouseReleased(){
  x=0;
  y=0;
}