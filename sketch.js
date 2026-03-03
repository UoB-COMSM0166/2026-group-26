class MRect{
  
  constructor(x,y){
    this.x = x;
    this.y = y;
    this.baseCircleSize = 100;
    this.circleSize = this.baseCircleSize;
    this.circleGap = 80;
    this.numCircles = 10;
    
    this.r = random(255);
    this.g = random(255);
    this.b = random(255);
    
    this.baseX = x;
    
  }
  
  display(){
    fill(this.r, this.g, this.b);
    noStroke();
    for(let i = 0; i<this.numCircles; i++){
      let circleX = this.baseX + i*this.circleGap + (mouseX / width) * 50;
      let circleY = this.y + (mouseY / height) * 50;
      ellipse(circleX, circleY, this.circleSize, this.circleSize);
    }
  }
  
   update(){
     if(this.numCircles > 0){
       this.numCircles--;
       this.baseCircleSize = max(5, this.baseCircleSize - 2);
       this.circleSize = this.baseCircleSize;
     }
   }
  
  mouseMoveUpdate(){
    this.circleGap = map(mouseX, 0, width, 10, 30);
    this.circleSize = map(mouseY, 0, height, 5, this.baseCircleSize);
  }
}

let circleGroups = [];

function setup(){
  
  createCanvas(800,800);
  background(0);
  circleGroups.push(new MRect(50, 100));
  circleGroups.push(new MRect(50, 300));
  circleGroups.push(new MRect(150, 500));
  circleGroups.push(new MRect(150, 700));

}


function draw(){
  background(0);
  for(let i = 0; i < circleGroups.length; i++){
    circleGroups[i].mouseMoveUpdate(); 
    circleGroups[i].display();
  }
}

function mousePressed(){
  for(let i = 0; i < circleGroups.length; i++){
    circleGroups[i].update();
  }
}