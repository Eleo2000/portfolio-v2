var cursor = document.querySelector('.cursor');
var c_c = document.querySelector('.cursor_c');
var c_p = document.querySelector('.cursor_p');
var cursor2 = document.querySelector('.cursor2');

let sp0 = document.querySelector(".sp0");
let sp1 = document.querySelector(".sp1");
let sp2 = document.querySelector(".sp2");
let btn_chat = document.querySelector(".chat-btn");



var change_on_hover = document.querySelectorAll(".h_m");

document.addEventListener('mousemove' , (e)=>{
    c_p.style.transform= "translateY("+(e.clientY-15)+"px) translateX("+(e.clientX-15)+"px)" ;
    c_c.style.transform= "translateY("+(e.clientY+2)+"px) translateX("+(e.clientX+3)+"px)" ;
    
});

/*****anim mouseover chat_btn*****/
btn_chat.onmouseover = (e)=>{
    btn_chat.style.transition = "0.8s ease-out";

    let y =e.clientY-btn_chat.offsetTop -30;
    let x =(e.clientX-btn_chat.offsetLeft-30);
    moove_btn(x,y,e);
    
    hovera();
    btn_chat.addEventListener('mousemove' , (e)=>{
        /**** limiter les val min sur (x,y) afin que btn_chat ne suive pas tout le temps le curseur xD ***/
        let y =e.clientY-btn_chat.offsetTop -30;
        let x =(e.clientX-btn_chat.offsetLeft-30);
        moove_btn(x,y,e);
        
    });
}
function moove_btn(x,y,e){
    if((x)< -25 ){
        x= -25;
    }else if(y<-20){
        y=-20
    }else if(x>15){
        x=15
    }
    else if(y>15){
        y=15
    }
    else{
        btn_chat.style.transform= "translateY("+y+"px) translateX("+x+"px)" ;
    }
}
btn_chat.onmouseleave= ()=>{
    btn_chat.style.transition = "0.5s ease-out";
    leave_mouse();
    setTimeout(() => {
	    btn_chat.style.transform= "translateY("+0+"px) translateX("+0+"px)" ; 
    }, 100);
}
    

change_on_hover.forEach(e => {
    e.addEventListener('mouseover', ()=>{
        hovera();
    });
});

change_on_hover.forEach(e => {
    e.addEventListener('mouseleave', ()=>{
        leave_mouse();
   });
});


function hovera(){
    cursor.style.animation = "c_disapear 0.2s ease-out forwards";
    
    sp0.style.transform = "translateY(-68px) rotate(-53deg)";
    sp1.style.transform = "translateY(43px) translateX(-53px) rotate(-45deg)";
    sp2.style.transform = "translateY(43px) translateX(53px) rotate(45deg)";
    
}
function leave_mouse(){
    
	cursor.style.animation = "c_appear 0.2s ease-out forwards";
    
    sp0.style.transform = "translateY(-3px) rotate(-90deg)";
    sp1.style.transform = "translateY(3px) translateX(-3px) rotate(-45deg)";
    sp2.style.transform = "translateY(3px) translateX(3px) rotate(45deg)";
    
    
}


