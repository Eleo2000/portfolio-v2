var section = document.querySelectorAll(".section");
var menu = document.querySelectorAll(".menu a");
var ico = document.querySelectorAll(".round a");
/***pour identifier si on est déjà dans la section projet */
var projects;

console.log(section.length);
    window.onscroll = () => {
    section.forEach((i) => {
        var top = window.scrollY;
        var offset = i.offsetTop - 300;
        var height = i.offsetHeight;
        var id = i.getAttribute("id");
        
        
        if (top >= offset && top < offset + height) {
            menu.forEach((link) => {
                link.classList.remove("active");
                if (id=="footer"){
                    //evitena mba tsy handeha amin lien an ilay contact ny style xD
                }else{
                    document
                    .querySelector(".menu a[href*=" + id + "]")
                    .classList.add("active");
                    if(id=="portf"){
                        projects=true;
                    }else{
                        projects=false;
                    }
                }
                
                
                console.log(id);
            });
            ico.forEach((li) => {
                li.classList.remove("active");
                document
                .querySelector(".round a[href*=" + id + "]")
                .classList.add("active");
                console.log(id);
            });
        }
    });
};

ico.forEach(e => {
    e.onclick = () =>{
        setTimeout(() => {
            menu_mini();
        }, 600);
        
    }
});

/*****custom */
  const links = document.querySelectorAll('#menu a');
  const menu_btn = document.getElementById('menu_btn');

  links.forEach((link) => {
    link.onclick = () => {
      menu_btn.classList.add('loading');
      setTimeout(() => {
        menu_btn.classList.remove('loading');
      }, 1200);
    };
  });