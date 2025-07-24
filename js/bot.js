// /*******Mbola tsy vita ito xD********/
// let content_chat = document.querySelector(".content-chat");
// let prop = document.querySelectorAll(".proposition");

// let chatbot = document.querySelector(".chatbot");
// let btn_chat = document.querySelector(".chat-btn");
// let close_chat = document.querySelector(".close-chat");

// let input = document.querySelector(".chat_input");

// //mbola ts vita le partie fonction arbre de reponse amin le chat bot ito !

// // prop[0].onclick = ()=>{
// //     render_msg("Nous vous offrirons le top.\nVoulez-vous des démos de projet? ","bot");
// //     var a =render_list("Voir nos projet");
// //     // a.onclick= ()=>{
// //     //     alert("xD")
// //     // }
// //     var b = render_list(" Autre chose");
// //     setScrollPosition();
// //     console.log(0 , "clicked" );

// // }


// // prop[1].onclick = ()=>{
// //     console.log(1, "clicked" );
// //     render_msg("Nos F.A.Q se trouvent ci-après : ","bot");
// //     FAQ_all();
// //     init_var();
// //     FAQ_show();
// //     setScrollPosition();
// // }

// // prop[2].onclick = ()=>{
// //     render_msg("Nous sommes en partenariat avec ces merveilleuses boites : ","bot");
// //     partenaire_atrib(3);
// //     // attrib_logo_partenaire(url_logo)
    
// //     console.log(2 , "clicked" );
// // }

// /***initialisena en  objet le el Tab */
// function init_props(){
//     let tab = [
//         {
//             name:"qualite",
//             values:""
//         },
//         {
//             name:"info_faq",
//             values:""
//         },
//         {
//             name:"partenaire",
//             values:""
//         }
//     ]
    
//     for(var i = 0; i<tab.length ; i++){
//         tab[i].values = render_list2(tab[i].name);
//     }
    
//     arbre_de_decision(tab);
// }
// render_msg("Salut...En quoi puis-je vous aider?","bot");
// init_props();

// /*****render_msg selon name de prop */
// function rendre_msg(name){
    
//     if(name == "qualite"){
//         render_msg("Nous vous offrirons le top.\nVoulez-vous des démos de projet? ","bot");
//         var p = render_list("Voir nos projet");
//         p.onclick =()=>{
//             //target makany amin projet na affichage projet
//             if(!projects){
                
                
// 	            render_msg("Vous êtes dans la section où nous pouvons consulter notre portfolio.", "bot");
//                 setScrollPosition();
//                 window.location.href= "#portf";
                
                
//             }else{
//                 render_msg("Vous y êtes déjà. Notre portfolio est juste à coté.", "bot");
//                 setScrollPosition();
//             }
            
//             //
//         }
//     }else if(name == "info_faq"){
//         render_msg("Nos F.A.Q se trouvent ci-après : ","bot");
//         FAQ_all();
//         init_var();
//         FAQ_show();
//     }else if(name == "partenaire"){
//         render_msg("Nous sommes en partenariat avec ces merveilleuses boites : ","bot");
//         partenaire_atrib(3);
//     // attrib_logo_partenaire(url_logo)
//     }

    
// }

// /******systeme arbre de decision******/
// //[0]["name"] [1]["name2"] [2]["name3"]
// function arbre_de_decision(tab){
    
//     if(tab.length>0){
//         tab.forEach((e,i)=>{
//             tab[i].values.onclick = ()=>{
                
                
//                 rendre_msg(e.name);
//                 //enlever e.name ou tab[i] du tab
//                 //mbola ts vita ito xD
//                 var a = tab.indexOf(e);
//                 //  alert(a)
//                 if(a >-1){ //esorina le element rehefa hita 
//                     tab.splice(a , 1) // esorina element iray irery ihany
//                 }
//                 // alert(tab)
//                 //affichage liste du tab restant
//                 for(var j = 0 ; j < tab.length; j++ ){
//                     tab[j].values = render_list2(tab[j].name);
//                 }
//                 if(tab.length == 0){
//                     var autre = render_list("Autre chose?");
//                     autre.onclick = ()=>{
//                         render_msg("Vous pouvez me poser d'autres question si vous voulez.","bot");
//                         /***opation de base */
//                         var b = render_list("revenir aux options");
//                         b.onclick=()=>{
//                             render_msg("Voilà :)","bot");
//                             init_props();
//                             setScrollPosition();
//                         }
//                         setScrollPosition();
//                     }
//                 }
//                 setScrollPosition();
//                 //puis relancer la fonction arbre_de_decision avec les nouvelles valeurs xD 
//                 arbre_de_decision(tab);
                
//             }
//         })
//     }
    
// }

// /***mila micréer function pour render_list2(name) => depend name du tab*/
// function render_list2(name){
//     if(name == "qualite"){
//          return render_list("qualité de nos services");
//     }
//     else if(name == "info_faq"){
//         return render_list("F.A.Q?");
//     }
//     else if(name == "partenaire"){
//         return render_list("nos partenaires?");
//     }
// }

// function render_msg(message,type){
//     const msg_c = document.createElement("div");
//     const msg_bot = document.createElement("div");
    
//     const txt_b = document.createTextNode(message);

//     if(type=="bot"){
//         //msg bot
//         const msg_i_bot = document.createElement("div");
//         msg_c.classList.add("chatbot-contain");
//         msg_i_bot.classList.add("chatbot-icone");
//         msg_bot.classList.add("chatbot-text");
//         msg_bot.append(txt_b);
//         msg_c.append(msg_i_bot , msg_bot);
//         content_chat.append(msg_c);
//     }else{
//         //msg user
//         msg_c.classList.add("user-contain");
//         msg_bot.classList.add("user-text");
//         msg_bot.append(txt_b);
//         msg_c.append(msg_bot);
//         content_chat.append(msg_c);
//     }
    
    
    
// }

// // Fonction add next list depend du choix de l user
// //mbola afaka ameliorena le izy
// function render_list(message){
//     const bot_list = document.createElement("div");
//     const txt = document.createTextNode(message);

//     bot_list.classList.add("proposition");
//     bot_list.append(txt);
//     content_chat.append(bot_list);
//     return bot_list;
// }

// const setScrollPosition = () =>{
//     if(content_chat.scrollHeight > 0 ){
//         content_chat.scrollTop = content_chat.scrollHeight;
//     }
// }

// btn_chat.onclick = () => {
 
//     chatbot.style.transform = "scale(1)";
//     chatbot.style.opacity = "1";
//     btn_chat.style.display ="none";
// }

// close_chat.onclick = () => {
//     chatbot.style.transform = "scale(0)";
//     chatbot.style.opacity = "0";
//     setTimeout(() => {
//         btn_chat.style.display ="initial";
//     }, 200);
    
// }



// /******** Sending message from input********/
// function sendMessage(){
    
    
//     if(input.textContent <1){

//     }else{
//         //a changer en tant que msg user
//         render_msg(input.textContent, "user");
//         setScrollPosition();

// 	    answer_bot(input.textContent );

        
//         input.innerHTML ="";
        
//     }
    
// }

// input.addEventListener("keypress" , (e)=>{
//     if(e.key == "Enter"){
//        sendMessage();
//        setTimeout(() => {
// 	        input.innerHTML = "";
//         }, 0.0000000000000000000000000000001);
//     }
// })



// // function render_list(message){
// //     const bot_list = document.createElement("div");
// //     const txt = document.createTextNode(message);

// //     bot_list.classList.add("proposition");
// //     bot_list.append(txt);
// //     content_chat.append(bot_list);
// // }


// /*****FAQ ******/

// function FAQ_content(question_aff , reponse_aff){
//     /***container */
//     const question_p = document.createElement("div");
//     question_p.classList.add("question");
//     /**question */
//     const question = document.createElement("div");
//     const quest = document.createElement("div");
//     const txt_question = document.createTextNode(question_aff);
//     const show = document.createElement('div');
//     const ico_show = document.createTextNode(">");

//     question.classList.add("questiona");
//     quest.classList.add("quest");
//     show.classList.add("show-answer");

//     quest.append(txt_question);
//     question.append(quest);
//     show.append(ico_show);
//     question.append(show);

//     /**reponse */
//     const answer= document.createElement('div');
//     const c_answer = document.createElement('div');
//     var txt_answer = document.createTextNode(reponse_aff);

//     c_answer.classList.add("content-answer");
//     answer.classList.add("answer");

//     c_answer.append(txt_answer);
//     answer.append(c_answer);

//     /***Append to container  ***/
//     question_p.append(question);
//     question_p.append(answer);
    
//     return question_p
// }

// /**** Append value to FAQ_all ****/
// function FAQ_all(){
//     const FAQ = document.createElement('div');
//     FAQ.classList.add('FAQ');
    
//     let element =[ 
//         FAQ_content("A propos de nous?","Nous sommes une ESN située à Fianarantsoa depuis 2023."),
//         FAQ_content("Comment savoir si nous sommes des personnes de confiance?" , "Car tous nos informations sont déjà mentionnées dans la section Equipe."),
//         FAQ_content("Est-ce qu'on recrute?" , "Oui nous cherchons actuellement une personne qualifiée pour le poste de community manager." )
//     ]
//     element.forEach(e=>{
//         FAQ.append(e);
//     })
//     content_chat.append(FAQ)
// }

// /***eto no mideclare var fa lasa undefined le izy  */
// function init_var(){
//      quest = document.querySelectorAll(".questiona");
//      answer = document.querySelectorAll(".answer");
//      icone_show = document.querySelectorAll(".show-answer");
// }


// function FAQ_show(){
//     quest.forEach((e,i) => {
//         e.onclick =()=>{
//             answer[i].classList.toggle('answer-s');
//             icone_show[i].classList.toggle("show-answer2");
//         }
//     })
// }


// /***partie partenaire ****/

// function partenaire(){
//     let partenaire = document.createElement("div");
//     partenaire.classList.add('partenaire');
//     return partenaire;
// }

// function partenaire_atrib(nb){
//     let partenaires =document.createElement("div");
//     partenaires.classList.add('partenaires');

//     for(var i=0 ; i<nb ;i++){
//         partenaires.append(partenaire());
//     }
    
//     content_chat.append(partenaires);
// }

// /***atao anatina tableau ny url_partenaire xD*/
// function attrib_logo_partenaire(url){
//     let p = document.querySelectorAll(".partenaire");
//     url.forEach(e=>{
//         p.style.backgroundImage=`url(${e})`
//     })
// }


// /******reponse bot via message*****/
// /*****A regler xD*****/
// function answer_bot(input_value){
//     let salutation = ["hi", "salut","hello there","bonjour"];
//     let unknown = ["je ne comprends pas." ,"je ne peux malheureusement pas vous répondre.","Essayer une autre question."];
//     let membre = ["Notre team comporte une diversité de personne" , "Notre équipe est toujours prêt à rélever des défi",
//     "Nous sommes toujours soudés !"];
//     let bye = ["Aurevoir." ,"A très bientôt!" , "Au plaisir de vous revoir."];

//     var input =input_value.toLowerCase();
    
//     // comment recuperer une portion de caractère dans un input ...
//     //puis verifier la similarité par à nos données (connaissances actuels )

//     if( salutation.indexOf(input) >-1){
//         var randomValue = rand( 0 ,salutation.length);
//         // alert(randomValue);
//         setTimeout(() => {
//             render_msg(salutation[randomValue],"bot");
//             setScrollPosition();
//         }, 200);
        
//     }else{

//     }
// }

// function rand(min, max) {
//     return Math.floor(Math.random() * (max - min ) + min);
// }
    
// /*****tokony mba controlena ny choix miverimberina ngambany xD
//  * asiana message d'arret xD
//  */



// /*****anim mouseover chat_btn*****/
// btn_chat.onmouseover = ()=>{
//     alert("xD")
// }
    
