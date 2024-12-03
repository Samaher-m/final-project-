var swiper = new Swiper('.slider-wrapper', {
    loop: true,
  effect:"coverflow",
   grabCursor: true,
   centerdSlides:true,
   initialSlide:1,
   speed:600,
   preventClicks:true,
   slidesPerView:"auto",
   coverflowEffect: {
    rotate:0,
    stretch:100,
    depth:350,
    slideShadow:true,
   },
 
   navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });


let creat = document.getElementsByClassName('.creatList')
let listName = document.getElementById('listName');
let creatImg = document.getElementById('creatImg');
let submit = document.getElementById('submit');
let title = document.getElementsByClassName('name');
let img = document.getElementsByClassName('edu-img');
let container = document.getElementById('container');
let eduList = document.getElementById('edu-item');
let table = document.getElementById('table');
let loader = document.getElementById('loader');
let showAll = document.getElementById('showAll');
let formsData = document.getElementById('formsData');
let results = document.getElementById('results');
let depList = document.getElementById('dep');


 
 async function downloadFile(id){
  const fileData = await (await fetch('/download/'+id)).json();

  if(fileData && fileData.file){
    const _a = document.createElement('a');
    _a.href=fileData.file;
    _a.target='_blank';
    _a.download = fileData.fileName;
    _a.click();
    _a.remove();
  }
 }

 async function openShowAll(id){
  showAll.classList.add("open-show");
  container.style.opacity= '0.6';

  loader2.style='display: block';

  // fetch data by id
  const Model = await fetch('/forms/'+id);
  const list = await Model.json();
  
  // hide loader 2
  loader2.style='display: none';
  // add data to formsDatas

  formsData.innerHTML = '';
  
  for(let i = 0 ; i<list.length ; i++){
      formsData.innerHTML += `<div>
      <table>
      <tr>
        <td>
         <a onclick="downloadFile('${list[i]._id}')" href="#"><h4>${list[i].model_name}</h4></a>
        </td>
      </tr>
    </table>
    </div>
    `;
  }
}

async function search(){
  const input = document.getElementsByClassName('searchInput')

  const Model = await fetch('/search', {
    method: 'post',
    body: JSON.stringify({
      name: input[0].value
    }),
    headers:{
      'content-type':'application/json'
    }
  });
  const list = await Model.json();
  results.innerHTML = '';
  
  for(let i = 0 ; i<list.length ; i++){
    results.innerHTML += `
     <ul>
        <li> <a onclick="downloadFile('${list[i]._id}')" href="#"><h4>${list[i].model_name}</h4></a></li>
     </ul>
    `;
  }
  //results
  console.log(list);
  
}

function closeShowAll(){
  showAll.classList.remove("open-show");
    container.style.visibility = 'visible';
  container.style.opacity = "1";
}

async function loadData() {
  const departments = await fetch('/departments');
  const list = await departments.json();

  loader.style='display: none';

  for(let i = 0 ; i<list.length ; i++){
    if(!list[i].img){
      list[i].img = 'photos/photo8.jpg';
    }

    eduList.innerHTML += `<div  class="edu-item swiper-slide ">
          <img src="photos/${list[i].img}" class="edu-img">
           <h2 class="name">${list[i].department_name} </h2>
            <button class="show" onclick="openShowAll('${list[i]._id}')">مشاهدة النماذج</button>
            
    </div>
    `
    }
}

loadData();

async function departmentForAdd(){
  
    const departments = await fetch('/departments');
    const list = await departments.json();

    for(let i = 0 ; i<list.length ; i++){
      
      depList.innerHTML += `
            <option value='${list[i]._id}'>${list[i].department_name} </option>
          
      `
      }
  }

  departmentForAdd();

async function authState() {
    if(location.hash && location.hash.startsWith('#key='))
    {
      let key = location.hash.replace('#key=', '');
      localStorage.setItem('auth', key);

      location.hash = '';
    }
    
    const auth = localStorage.getItem('auth');
    if(auth){
      document.getElementById('creatModel').style='';
      
      document.getElementById('loginLink').style='display: none';
      document.getElementById('logoutLink').style='';
    }else{
      document.getElementById('creatModel').style='display: none';

      document.getElementById('loginLink').style='';
      document.getElementById('logoutLink').style='display: none';

    }
}

authState();

function logout(){
  localStorage.removeItem('auth');
  document.getElementById('creatModel').style='display: none';

      document.getElementById('loginLink').style='';
      document.getElementById('logoutLink').style='display: none';
}

async function submitForm(){
  const modelName = document.getElementById('modelName').value;
  const model = document.getElementById('model').files[0];
  const dep = document.getElementById('dep').value;

  if(modelName && model && dep){
    const _file = await new Promise((_set)=>{
      const reader = new FileReader();
      reader.onload = (_e)=>{
        _set(_e.target.result);
      }
      reader.readAsDataURL(model);
    });

    const send = await fetch('/add', {
      method: 'post',
      body: JSON.stringify({
        name: modelName,
        file: _file,
        fileName: model.name,
        fileType: model.type,
        department: dep
      }),
      headers:{
        'content-type':'application/json',
        auth: localStorage.getItem('auth')
      }
    });

    console.log(send);
  }
}