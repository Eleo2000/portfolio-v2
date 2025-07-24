var loader_p = document.querySelector('.load-p')

//boutton play  à regler xD
var projet = document.querySelectorAll(".projet");
var video_p ;
var preva ;
var nexta;
var video;
var video_affiche = document.querySelector('.video');
var img_affiche = document.querySelector('.images');

var card_p;
var value_change;

var nb_active = 0;

/****** on peu rendre ça dynamique *******/
var dist = 0;

var nb_a = 0;
var nb_t = 0;
/******** nb clic à ne pas depasser ******/
var v_max = 0;

var nbg = 0;
var nbd = 0;

/******** nbd/g equivaut nb card à doite/gauche invisible ******/


/******* w taille ecrans suivant x (axe navigateur ) *******/
var largeur_ecran = window.innerWidth;

/***** nb_t équivaut au nb des card ******/



/*******mbola afaka améliorena*******/
projet.forEach((p,index_p) => {
    p.onclick = () => {
        var nb_active = 0;

        /****** on peu rendre ça dynamique *******/
        var dist = 0;

        var nb_a = 0;
        var nb_t = 0;
        /******** nb clic à ne pas depasser ******/
        var v_max = 0;

        var nbg = 0;
        var nbd = 0;

        //reglage bug chatbot
        btn_chat.style.display ="none";


        //miankin a amin ito ilay choix background big-IMG 
        value_change = index_p;

        init_affichage(nb_active);
        //A rendre en fonction init_value xD
        video_p = document.querySelector(`.v-${value_change}`);
        preva = document.querySelector(`.v-${value_change} .slider .preva`);
        nexta = document.querySelector(`.v-${value_change} .slider .nexta`);

        card_p = document.querySelectorAll(`.v-${value_change} .slider .slide-portfolio .portfolio-card`);
        photo = document.querySelectorAll(`.v-${value_change} .slider .slide-portfolio .portfolio-card .photo-portfolio`);
        video = document.querySelector(`.v-${value_change} .video`);
        
        nb_t= card_p.length;

        //attribution image ...here on prédéfini à l avance leurs noms selon value_change et rang card xD
        //amboarina xD
        video.src = `assets/video/${value_change}-video.mp4`;
        console.log(video.src);
        for(var i=0 ; i< nb_t ; i++){
            
            photo[i].src = `assets/test/${value_change}-photo-${i}.png`;

        }

        /******à rendre en fonction xD*******/
        card_p.forEach(c => {
            c.classList.remove("activee");
        });
        afficheP();
        /******* nbd recuperation *******/
        function calc_nbd(nbg , nb_a , nb_t){
            var d = nb_t -( nbg + nb_a );
            return d ;
        }



        /****** nb_a Depend Taille de l'Ecran******/
        function card_portfolio_aff(){
                nb_a = 4;
        }


        function anim_next(dist){
            for ( i=0 ; i< nb_t ; i++){
                `${document.querySelector(`.v-${value_change} .slider .slide-portfolio .p-${i}`).style.transform = `translateX(${-dist}rem)`}`
            }
        }




        /******** debut *****/
        card_portfolio_aff();

        card_p[nb_active].classList.add("activee");
        

        /*****rendre disable preva******/

        v_max = nb_t - nb_a ;
        /****regle bug affichage overflow********/
        anim_next(0);

        console.log(nb_a);

        /**mbola misy bug ito xD bleme xD */
        window.addEventListener("resize" , ()=>{
        
            card_portfolio_aff();
            v_max = nb_t - nb_a ;
            console.log("v_max",v_max);

            
            if(nbg > v_max){
                /******* dist pour le deplacement xD *****/
                var d = nbg-v_max;

                dist = dist - d*13; 
                anim_next(dist);
                nbg = nb_t - nb_a ;
                console.log("amin boucle reset eto xD",i);

            }
                
            

            console.log("nombre à gauche",nbg);
        });

        nexta.addEventListener('click' , suivante);
        preva.addEventListener('click' , precedente);
        
        /*****Ato no mampiova sary sy slide focus*******/
        card_p.forEach((el,index) => {
            el.onclick=() =>{
                card_p.forEach(c => {
                    c.classList.remove("activee");
                });
                //sary miova miankina amin nb_active 
                el.classList.add("activee");
                nb_active = index ;

                if(index!=0){
                    
                    //     /*****Ato no manao animation load images****/
                    // img_affiche.onload =()=>{
                    //     //image chargé du coup on enleve l animation
                    //     loader_p.style.display="none";
                    // }
                    // //animation loading
                    // loader_p.style.display="initial"

                    img_affiche.src = `assets/original/${value_change}-photo-${nb_active}.png`;
                }
                
                init_affichage(nb_active);

                console.log( el.dataset.rate);
            }
        });

        function suivante(){

       

            /*****Ito no mampiova sary sy slide focus*******/
            if(nb_active==(nb_t-1)){
                nb_active=(nb_t-2)
            }
            nb_active+=1;

            init_affichage(nb_active);
            
            card_p.forEach(c => {
                c.classList.remove("activee");
            });
            //sary miova
            if(nb_active!=0){
                // /*****Ato no manao animation load images****/
                // img_affiche.onload =()=>{
                //     //image chargé du coup on enleve l animation
                //     loader_p.style.display="none";
                // }
                // //animation loading
                // loader_p.style.display="initial"

                img_affiche.src = `assets/original/${value_change}-photo-${nb_active}.png`;
            }
            card_p[nb_active].classList.add("activee");
            

            card_portfolio_aff();
            nbd = calc_nbd(nbg , nb_a , nb_t);
            v_max = nb_t - nb_a ;
            console.log(nbg);
            if( nbg < v_max && nbg>=0){
                //animation translation vers la gauche
                dist+=13;
                anim_next(dist);
                
                nbg += 1;
                nbd -= 1;
                nbd == 0 ? console.log("nbd = 0") : console.log("nbd !=0");
                // console.log(nbg);
                console.log(nbd);
            }
        }

        function precedente(){

            /*****Ito no mampiova sary sy slide focus*******/
            console.log(nb_active,"itooooo");
            init_affichage(nb_active -1 );
            if(nb_active==0){
                init_affichage(nb_active);
                nb_active=1;
                
            }
            
            
            nb_active-=1;
            card_p.forEach(c => {
                c.classList.remove("activee");
            });
            //sary miova xD
            if(nb_active!=0){
                    
                // /*****Ato no manao animation load images****/
                // img_affiche.onload =()=>{
                //     //image chargé du coup on enleve l animation
                //     loader_p.style.display="none";
                // }
                // //animation loading
                // loader_p.style.display="initial"
                
                img_affiche.src = `assets/original/${value_change}-photo-${nb_active}.png`;
            }
            card_p[nb_active].classList.add("activee");


            card_portfolio_aff();
            nbd = calc_nbd(nbg , nb_a , nb_t);
            v_max = nb_t - nb_a ;

            if( nbd < v_max && nbd >=0 ){
                //animation translation vers la droite
                dist-=13;
                anim_next(dist);
                nbg -= 1;
                nbd += 1;
                nbg == 0 ? console.log("nbg = 0") : console.log("nbg !=0");
                // console.log(nbd);
                console.log(nbg);
            }
        }

        function afficheP(){
            video_p.style.display="initial"
        }

    }

});

function quitPortfolio(){
    //reglage bug on mobile chatbot
    btn_chat.style.display ="initial";
    video_p.style.display="none";
}


function init_affichage(nb_active){
    if(nb_active==0 ) {
        video_affiche.style.display = "flex" ;
        img_affiche.style.display = "none" ;
    }else{
        video_affiche.style.display = "none" ;
        img_affiche.style.display = "flex" ;
    }
}