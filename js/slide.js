var prev = document.querySelector('.prev');
var next = document.querySelector('.next');
var card = document.querySelectorAll(' .card-membre');

/****** on peu rendre ça dynamique *******/
var distance = 0;

var nb_affiche = 0;
var nb_total = 0;
/******** nb clic à ne pas depasser ******/
var v_max = 0;

var nb_g = 0;
var nb_d = 0;

/******** nb_d/g equivaut nb card à doite/gauche invisible ******/


/******* w taille ecrans suivant x (axe navigateur ) *******/
var largeur_ecran = window.innerWidth;

/***** nb_total équivaut au nb des card ******/
nb_total= card.length;

/******* nb_d recuperation *******/
function calc_nb_d(nb_g , nb_affiche , nb_total){
    var d = nb_total -( nb_g + nb_affiche );
    return d ;
}



/****** nb_affiche Depend Taille de l'Ecran******/
function card_affichage(){

    if(largeur_ecran!= innerWidth){
        largeur_ecran = innerWidth;
    }

    if(largeur_ecran >1024){
        nb_affiche = 4;
    }else if(largeur_ecran <965 && largeur_ecran > 800){
        nb_affiche = 3;
    }else if(largeur_ecran < 800 && largeur_ecran >600 ){
        nb_affiche = 2;
    }else if(largeur_ecran < 600 ){
        nb_affiche = 1;
    }
    
}


function anim_suivant(distance){
    for ( i=0 ; i< nb_total ; i++){
        `${document.querySelector(`.m-${i}`).style.transform = `translateX(${-distance}rem)`}`
    }
}

function anim_suivant(distance){
    for ( i=0 ; i< nb_total ; i++){
        `${document.querySelector(`.m-${i}`).style.transform = `translateX(${-distance}rem)`}`
    }
}

function verif_arrow(){
    if(nb_g==0){
        
    }
}


/******** debut *****/

card_affichage();
v_max = nb_total - nb_affiche ;
/****regler bug affichage overflow********/
anim_suivant(0);

/**mbola misy bug ito xD bleme xD */
window.addEventListener("resize" , ()=>{
   
    card_affichage();
    v_max = nb_total - nb_affiche ;

    
    if(nb_g > v_max){
        /******* distance pour le deplacement xD *****/
        var d = nb_g-v_max;

        distance = distance - d*13; 
        anim_suivant(distance);
        nb_g = nb_total - nb_affiche ;

    }
});

next.addEventListener('click' , suivant);
prev.addEventListener('click' , precedent);

//tokony mbola à tooglena ny class an  var prev,next to disable rehefa ts afaka atao next na previous intsony
function suivant(){

    card_affichage();
    nb_d = calc_nb_d(nb_g , nb_affiche , nb_total);
    v_max = nb_total - nb_affiche ;
    if( nb_g < v_max && nb_g>=0){
        //animation translation vers la gauche
        distance+=13;
        anim_suivant(distance);
        
        nb_g += 1;
        nb_d -= 1;
        
    }
}

function precedent(){

    card_affichage();
    nb_d = calc_nb_d(nb_g , nb_affiche , nb_total);
    v_max = nb_total - nb_affiche ;

    if( nb_d < v_max && nb_d >=0 ){
        //animation translation vers la droite
        distance-=13;
        anim_suivant(distance);
        nb_g -= 1;
        nb_d += 1;
    }
}