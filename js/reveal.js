/*Partie api observer xD */

var observer = new IntersectionObserver(function(entries){

    entries.forEach(function(entry){
        if(entry.intersectionRatio>0.3){
            //animation visible xD
            entry.target.classList.add("reveal-active");
            observer.unobserve(entry.target)
        }else{
            //animation invisible xD
        }
    })

},{
    threshold:[0.5]
})

/* application sur un ou plusieurs elements suivant leurs classes xD*/
var items = document.querySelectorAll("[class*=revealR-]");
    items.forEach(function(item){
    observer.observe(item);
})

var items = document.querySelectorAll("[class*=revealS-]");
    items.forEach(function(item){
    observer.observe(item);
})

var items = document.querySelectorAll("[class*=revealL-]");
    items.forEach(function(item){
    observer.observe(item);
})

/********rectifier bug image accueil********/
window.onload=() =>{
    
    var wid = innerWidth;
    if(wid <420){
        document.querySelector(".right").style.overflow="initial";
    }
}


window.onresize = () =>{
    if(innerWidth <420){
        document.querySelector(".right").style.overflow="initial";
    }
}