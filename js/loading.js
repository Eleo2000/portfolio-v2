
window.addEventListener("DOMContentLoaded", (event) => {
    setTimeout(() => {
        document.querySelector('.logoEvolutech').style.animation="disapearXd 0.01s ease-in-out forwards";

        document.querySelector("#l0").style.animation="fondXdL0 1.6s ease-out  forwards";
        document.querySelector("#r0").style.animation="fondXdR0 1.6s ease-out  forwards";
        document.querySelector("#l1").style.animation="fondXdL0 1.6s ease-out 0.008s forwards";
        document.querySelector("#r1").style.animation="fondXdR0 1.6s ease-out 0.0019s forwards";
        /*à ameliorer xD */
        // document.querySelector(".right").style.overflow="hidden"

    },200);
    
    setTimeout(() => {
        document.querySelector(".loaderXd").style.display="none";
        document.querySelector(".loaderXd").style.zIndex="1";

    
    },700);

    setTimeout(() => {
        
        document.querySelector("body").style.overflowY="initial"
    
    },700);
    
});
