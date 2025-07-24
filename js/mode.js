/******
 * le variable couleur atao unique de le opacité no reglena @css 
 * de io var couleur io no soloina rehefa manova mode 
 * *******/
 var change = document.getElementById("change");
 var formu = document.querySelector("form");
 var demi_l = document.querySelector(".demi-ligne");

 var logo = document.querySelector("#logo_evolutech")

 /****haand-accueil****/
 let hand_l = document.querySelector('.h-left');
 let hand_r = document.querySelector('.h-right');

logo.style.display="1px black";

/***svg à animer *****/
let lumi_source= document.querySelector('#lumi-source');
let nuage_1 = document.querySelector("#nuage-1");
let nuage_2 = document.querySelector("#nuage-2");
let fond_source = document.querySelector("#fond-source");
let source = document.querySelector("#source");
let etoiles = document.querySelector("#etoiles");
let shadow = document.querySelector("#truc");


;/*******Changement de mode xD******/
 change.onclick = () =>{
    change.classList.toggle('light-mode');
    if(change.classList.toggle('theme-dark')){
        lumi_source.style.animation=" disap-l 0.3s ease-out forwards";
        nuage_1.style.animation ="disap-n 0.2s ease-out forwards";
        nuage_2.style.animation ="disap-n 0.2s ease-out forwards";
        fond_source.style.animation="change-s 0.2s ease-out  forwards";
        source.style.animation="change-to-lune 0.2s ease-out forwards";
        etoiles.style.animation="app-etoile 0.4s ease-out 0.4s forwards";
        shadow.style.animation="app-ombre 0.2s ease-out 0.2s forwards";

        /*****texte*****/
        document.documentElement.style
        .setProperty('--c-principal', 'beige');

        /****fond*****/
        document.documentElement.style
        .setProperty('--c-fond', '#171717');

        /*****border*****/
        document.documentElement.style
        .setProperty('--c-border', 'white');

        /****right blur*****/
        document.documentElement.style
        .setProperty('--c-right', '#25b3ff');

        /****left blur*****/
        document.documentElement.style
        .setProperty('--c-left', '#EF6629');

        /****stroke-design*****/
        document.documentElement.style
        .setProperty('--c-stroke', '#8c8c8c');

        /****demi-ligne****/
        demi_l.style.backgroundColor="beige";

        /****form******/
        formu.style.backgroundColor ="rgba(0, 0, 0, 0.192)";

        canvas.style.display="initial"

        /****removing class bright_hand from hands */
        hand_l.classList.remove("bright_hand");
        hand_r.classList.remove("bright_hand");
    }
    
    else{
        /**misy bug rehefa asiana delay**/
        lumi_source.style.animation=" disap-l-r 0.3s ease-out forwards";
        nuage_1.style.animation ="disap-n-r 0.2s ease-out  forwards";
        nuage_2.style.animation ="disap-n-r 0.2s ease-out   forwards";
        fond_source.style.animation="change-s-r 0.2s ease-out forwards";
        source.style.animation="change-to-lune-r 0.2s ease-out forwards";
        etoiles.style.animation="app-etoile-r 0.4s ease-out forwards";
        shadow.style.animation="app-ombre-r 0.1s ease-out forwards";
        /*****texte*****/
        document.documentElement.style
        .setProperty('--c-principal', '#141414');

        /****fond*****/
        document.documentElement.style
        .setProperty('--c-fond', 'rgb(240, 240, 240)');

        /*****border*****/
        document.documentElement.style
        .setProperty('--c-border', '#3f3f3f');

        /****right blur*****/
        document.documentElement.style
        .setProperty('--c-right', '#25b3ff00');

        /****left blur*****/
        document.documentElement.style
        .setProperty('--c-left', '#EF662900');

        /****stroke-design*****/
        document.documentElement.style
        .setProperty('--c-stroke', 'rgb(240, 240, 240)');

        /****demi-ligne****/
        demi_l.style.backgroundColor="grey";
        /****form****/
        formu.style.backgroundColor ="rgb(43 43 43 / 78%)";

        canvas.style.display="none"

        /***modif main en light mode */
        hand_l.classList.add("bright_hand");
        hand_r.classList.add("bright_hand");

    }
    // console.log("clicked");
 }
