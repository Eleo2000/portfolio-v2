const canvas = document.getElementById("canvas1");
const righta = document.querySelector('.right');
const ctx = canvas.getContext('2d');
//A regler
canvas.width = window.innerWidth ;
canvas.height = window.innerHeight;

let particlesArray;

//get mouse position
let mouse = {
    x : null,
    y : null,
    radius : (canvas.height/80)*(canvas.width/80)
}

// window.addEventListener("mousemove" , 
//     function(e){
//         mouse.x = e.x;
//         mouse.y = e.y;
//     }
// );
// window.addEventListener("mousemove" , 
//     function(e){
//         mouse.x = e.clientX - e.target.offsetLeft;
//         console.log(mouse.x,"mouse x");
//         mouse.y = e.clientY - e.target.offsetTop;
        
//     }
// );

//create particle
class Particle {
    constructor(x , y , directionX , directionY , size , color){
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
    }

    //method to draw individual particle
    draw(){
        ctx.beginPath();
        ctx.arc(this.x , this.y, this.size , 0 , Math.PI * 2, false);
        ctx.fillStyle = '#5082a0';
        ctx.fill();
    }
    //check particle position , check mouse position , move the particle ,draw the particle
    update(){
        //check if particle is still within canvas
        if(this.x > canvas.width || this.x < 0){
            this.directionX = -this.directionX;
        }
        if(this.y >canvas.height || this.y < 0){
            this.directionY = -this.directionY;
        }

        //check collision detection - mouse position / particle position //vitesse this.x à ajuster
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        
        if(d < mouse.radius + this.size){
            if(mouse.x < this.x && this.x < canvas.width - this.size * 10){
                this.x +=3;
            }
            if(mouse.x > this.x && this.x > this.size * 10){
                this.x -=3;
            }
            if(mouse.y < this.y && this.y < canvas.height - this.size * 10){
                this.y +=3;
            }
            if(mouse.y > this.y && this.y > this.size * 10){
                this.y -=3;
            }
        }
        //move particle
        this.x +=this.directionX/4;
        this.y +=this.directionY/4;
        //draw particle
        this.draw();

    }
}

//create particle array
function init(){
    particlesArray = [];
    let nbParticles = (canvas.height * canvas.width)/14000;
    for(let i =0; i< nbParticles ; i++){
        let size = (Math.random() * 3.5) +1;
        let x = (Math.random() * ((innerWidth - size * 2) - (size *2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size *2)) + size * 2);
        let directionX = (Math.random() * 5) - 2.5;
        let directionY = (Math.random() * 5) - 2.5;
        let color = '#5082a0';

        particlesArray.push(new Particle(x , y , directionX , directionY , size , color));


    }
}


//animation loop
function animate(){
    requestAnimationFrame(animate);
    ctx.clearRect(0,0,innerWidth,innerHeight);

    for(let i =0 ; i < particlesArray.length ; i++){
        particlesArray[i].update();
    }
    connect();
}

//check if particles are close enough to draw line between them
function connect(){
    let opacity_value = 1 ;
    for (let a =0 ; a< particlesArray.length ; a++){
        for(let b = a ; b< particlesArray.length ; b++){
            let d = ((particlesArray[a].x - particlesArray[b].x)
            * (particlesArray[a].x - particlesArray[b].x))
            +((particlesArray[a].y - particlesArray[b].y) 
            * (particlesArray[a].y - particlesArray[b].y));

            if(d <(canvas.width/7) * (canvas.height/7)){
                opacity_value = 0.5 - (d /20000);
                ctx.strokeStyle = 'rgba(255,255,255,'+opacity_value+')' ;
                lineWidth = 1 ;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x , particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

//event mouse not moving after 0.3s xD

//event resize
window.addEventListener('resize', () =>{
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    mouse.radius = ((canvas.height/50) * (canvas.height/50));
    init();
})

//mouse out event
window.addEventListener('mouseout' , () => {
    mouse.x = undefined;
    mouse.y =undefined;
} )

init();
animate();