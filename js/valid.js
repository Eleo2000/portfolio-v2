/*******mbola ts vita ito xD*******/
let form = document.querySelector(".contact_form");
let backXd = document.querySelector('.backXd');
let menu_burger = document.querySelector('.menu-burger');
let header = document.querySelector(".header");

let is_howModalMail = false;

let other = false;
//a fermer click sur [X]
//validation à reset value si envoyé xD

function back(){
    form.style.display = "none";
    blur.style.zIndex="42";
    blur.classList.toggle('blur-active');
    section.forEach((e) =>{
        e.classList.remove("activa");
    })
    
    // header.style.filter = "blur(0)";
    is_howModalMail = false
}
function show(){
    if(is_howModalMail){
        back();
        return
    } 
    is_howModalMail = true
    other=true;
    form.style.display = "grid";
    blur.style.zIndex="50";
    blur.classList.toggle('blur-active');
    section.forEach((e) =>{
        e.classList.add("activa");
    })
    
    // header.style.filter = "blur(7px)";
}


