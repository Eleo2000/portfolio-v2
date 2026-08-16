const canvas = document.getElementById("canvas1");
const righta = document.querySelector('.right');
const ctx = canvas.getContext('2d');
//A regler
canvas.width = window.innerWidth ;
canvas.height = window.innerHeight;

let particlesArray;
let isVisible = true;
let rafId = null;

//get mouse position
let mouse = {
    x : null,
    y : null,
    radius : (canvas.height/80)*(canvas.width/80)
}

// Pause quand onglet caché
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        isVisible = false;
        if (rafId) cancelAnimationFrame(rafId);
    } else {
        isVisible = true;
        if (!rafId) animate();
    }
});

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
    // Limite le nombre de particules pour éviter O(n²) trop lourd
    const area = canvas.width * canvas.height;
    const targetParticles = Math.min(100, Math.floor(area / 18000));
    for(let i =0; i< targetParticles ; i++){
        let size = (Math.random() * 2) + 0.8;
        let x = (Math.random() * ((innerWidth - size * 2) - (size *2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size *2)) + size * 2);
        let directionX = (Math.random() * 4) - 2;
        let directionY = (Math.random() * 4) - 2;
        let color = '#5082a0';

        particlesArray.push(new Particle(x , y , directionX , directionY , size , color));


    }
}


//animation loop
function animate(){
    rafId = requestAnimationFrame(animate);
    if (!isVisible) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for(let i =0 ; i < particlesArray.length ; i++){
        particlesArray[i].update();
    }
    connect();
}

//check if particles are close enough to draw line between them
function connect(){
    // Réduction du rayon de connexion : moins de calculs et moins de lignes
    const maxDist = Math.min(canvas.width, canvas.height) / 8;
    const maxDistSq = maxDist * maxDist;

    for (let a =0 ; a< particlesArray.length ; a++){
        for(let b = a + 1 ; b < particlesArray.length ; b++){
            const dx = particlesArray[a].x - particlesArray[b].x;
            const dy = particlesArray[a].y - particlesArray[b].y;
            const d = dx*dx + dy*dy;

            if(d < maxDistSq){
                const opacity_value = Math.max(0, 0.45 - (d / (maxDistSq * 1.5)));
                ctx.strokeStyle = 'rgba(255,255,255,'+opacity_value+')' ;
                ctx.lineWidth = 1 ;
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
let resizeTimeout;
window.addEventListener('resize', () =>{
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        mouse.radius = ((canvas.height/50) * (canvas.height/50));
        init();
    }, 150);
})

//mouse out event
window.addEventListener('mouseout' , () => {
    mouse.x = undefined;
    mouse.y =undefined;
} )

init();
animate();