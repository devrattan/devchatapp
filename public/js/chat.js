const socket = io();

//elements
const $messageForm       = document.querySelector('#message-form')
const $messageFormInput  = document.querySelector('input');
const $messageFormButton = document.querySelector('button');
const $sendLocation      = document.querySelector('#send-location')      
const $messages          = document.querySelector('#messages')

//templates
const messageTemplate    = document.querySelector('#message-template').innerHTML;
const locationTemplate   = document.querySelector('#location-template').innerHTML;
const sidebarTemplate    = document.querySelector('#sidebar-template').innerHTML;

//options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll = ()=>{
    //new message element
   
    const $newMessage = $messages.lastElementChild;

    //height of the new message 
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height 
    const visibleHeight = $messages.offsetHeight;

    //height of message container
    const containerHeight = $messages.scrollHeight;
  
      //how far i have scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
          $messages.scrollTop = $messages.scrollHeight;
    }

}


socket.on('message',(message)=>{
    console.log(message);
    const html = Mustache.render(messageTemplate,{
        username : message.username, 
        message : message.text,
        createdAt : moment(message.createdAt).format("DD-MMM-YYYY hh:mm A")
    });
    $messages.insertAdjacentHTML("beforeend",html);
    autoscroll();
});

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    $messageFormButton.setAttribute('disabled','disabled');
          

    const message = e.target.elements.message.value;
     
    socket.emit('sendMessage',message , (option)=>{
        $messageFormInput.value='';
        $messageFormInput.focus()
        $messageFormButton.removeAttribute('disabled');
        if(option){
           return console.log(option);
        }
        console.log('The message has been delivered');
    });
})

$sendLocation.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation does not work on your browser');
    }
    $sendLocation.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position)=>{
       socket.emit('sendLocation',{longitude:position.coords.longitude,latitude:position.coords.latitude},()=>{
        $sendLocation.removeAttribute('disabled');           
        console.log('Location Shared')
       });
          
    })
})

socket.on('locationMessage',(locationMessage)=>{
    console.log(locationMessage);
    let html = Mustache.render(locationTemplate,{
        username : locationMessage.username,
        url : locationMessage.url,
        createdAt : moment(locationMessage.createdAt).format('DD-MMM-YYYY HH:mm A') 
    });
    $messages.insertAdjacentHTML("beforeend",html);
    autoscroll();
})

socket.on('sendMessage',(message)=>{
    console.log(message);
})

socket.emit('join',{username,room},(error)=>{
if(error){
    alert(error)
    location.href='/';
}
});

socket.on('roomData',({room,users})=>{
    let html = Mustache.render(sidebarTemplate,{
      room,
      users,
    })
    document.querySelector('#sidebar-list').innerHTML = html
     
})