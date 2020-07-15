            

            const channelButtonTemplate = Handlebars.compile(document.querySelector('#channel-button').innerHTML);
            const sentMessageTemplate = Handlebars.compile(document.querySelector('#sent_message').innerHTML);
            const receivedMessageTemplate = Handlebars.compile(document.querySelector('#received_message').innerHTML); 
            const deletedMessageTemplate = Handlebars.compile(document.querySelector('#deleted_message').innerHTML);


            document.addEventListener('DOMContentLoaded', function() {

                
                username =  document.querySelector('#username').innerHTML;
                localStorage.setItem('username',username);

                //connect to socket
                var socket = io.connect(location.protocol+'//'+document.domain+':'+location.port);

                //last channel is stored in local storage
                if(localStorage.getItem('currentChannel')){
                    const channelName = localStorage.getItem('currentChannel');
                    socket.emit('get channel',{'channelName':channelName});
                }

                document.querySelector('#createChannel').disabled=true;
                document.querySelector('#newChannelName').onkeyup = () => {
                    if (document.querySelector('#newChannelName').value.length>0)
                        document.querySelector('#createChannel').disabled=false;
                    else
                        document.querySelector('#createChannel').disabled=true;
                };

                document.querySelector('#sendMessage').disabled=true;
                document.querySelector('#newMessage').onkeyup = () => {
                    if (document.querySelector('#newMessage').value.length>0
                        &&
                        localStorage.getItem('currentChannel'))//enable user to send message if the user in inside a channel
                        document.querySelector('#sendMessage').disabled=false;
                    else
                        document.querySelector('#sendMessage').disabled=true;
                };


                //configure channel buttons after loading content
                    document.querySelectorAll('button#channelButton').forEach(button =>{
                        button.onclick = () => {
                            const channelName = button.dataset.channel;
                            socket.emit('get channel',{'channelName':channelName});
                        };
                    });

                //configure delete buttons
                document.querySelectorAll('.deleteButton').forEach(button=>{
                    button.onclick = () =>{
                        //get info about the message
                        const message = button.parentElement;
                        const content = message.dataset.content;
                        const messageTime = message.dataset.time;
                        const messageSender = message.dataset.user;
                        const messageChannel = localStorage.getItem('currentChannel');

                        //delete the content of the message
                        message.children[1].innerHTML="This message was deleted";
                        socket.emit('delete',{'sender':messageSender,'channel':messageChannel,'content':content,'time':messageTime});
                    }
                })    




                socket.on('connect', ()=>{

                    document.getElementById("formCreateChannel").addEventListener('submit', event => {
                        event.preventDefault();
                        const channelName = document.querySelector('#newChannelName').value;
                        socket.emit('new channel',{'channelName':channelName});
                        return false;  
                    });

                    //New message
                    document.getElementById("formNewMessage").addEventListener('submit', event => {
                        event.preventDefault();
                        const channelName = localStorage.getItem('currentChannel');
                        const sender = localStorage.getItem('username');
                        const message = document.querySelector('#newMessage').value;
                        console.log(`Sending message to server as ${sender}`)
                        socket.emit('new message',{'channelName':channelName, 'sender':sender, 'message':message});
                        return false;  
                    });
                });


                socket.on('create channel', data =>{
                    //clear input field
                    document.querySelector('#newChannelName').value="";
                    //create channel button from template
                    const channelButton = channelButtonTemplate({'channelName':data.channelName});
                    console.log(data.channelName);
                    document.querySelector('#channelList').innerHTML+=channelButton;


                //configure buttons
                    document.querySelectorAll('button#channelButton').forEach(button =>{
                        button.onclick = () => {
                            const channelName = button.dataset.channel;
                            socket.emit('get channel',{'channelName':channelName});
                        };
                    });
                });

                socket.on('show channel', data=>{
                    const channelName = data["channelName"];
                    console.log(`Current channel is ${channelName}`)
                    document.querySelector('#channelName').innerHTML=channelName;
                    localStorage.setItem('currentChannel', channelName);
                    document.querySelector('#chat-area').innerHTML="";
                    //render messages in that channel
                    const messages = data["messages"];//list of message-dicts
                    for(let i=0; i<messages.length; i++){
                        var msg=messages[i];
                        if(msg.sender===username){//if the sender of the message is the user logged in
                           document.querySelector('#chat-area').innerHTML+= sentMessageTemplate({"sender":msg.sender,"time":msg.time,"content":msg.content});    
                        } else{
                           document.querySelector('#chat-area').innerHTML+= receivedMessageTemplate({"sender":msg.sender,"time":msg.time,"content":msg.content});
                        }
                        document.querySelectorAll('.deleteButton').forEach(button=>{
                    button.onclick = () =>{
                        //get info about the message
                        const message = button.parentElement;
                        const content = message.dataset.content;
                        const messageTime = message.dataset.time;
                        const messageSender = message.dataset.user;
                        const messageChannel = localStorage.getItem('currentChannel');

                        //delete the content of the message
                        message.children[1].innerHTML="This message was deleted";
                        console.log(`${messageSender} requested to delete "${content}" from ${messageChannel}`)
                        socket.emit('delete',{'sender':messageSender,'channel':messageChannel,'content':content,'time':messageTime});
                    }
                });
                    };
                });


                // show message in the users chat area if msg.channel===currentChannel
                socket.on('broadcast message', data=>{
                    document.querySelector('#newMessage').value=""
                    const messageChannel = data["channel"];
                    const currentChannel = localStorage.getItem('currentChannel');
                    const currentUser = localStorage.getItem('username');
                    const sender = data["sender"];
                    const time = data["time"];
                    const content = data["content"];
                    console.log(`${sender} sent a message to Channel: ${messageChannel} at ${time}`)
                    if(messageChannel===currentChannel){
                        if(sender===currentUser){
                           document.querySelector('#chat-area').innerHTML+= sentMessageTemplate({'sender':sender,'time':time,'content':content});
                        } else{
                            document.querySelector('#chat-area').innerHTML+= receivedMessageTemplate({'sender':sender,'time':time,'content':content});
                        }
                        
                    } else {

                    }
                    document.querySelectorAll('.deleteButton').forEach(button=>{
                    button.onclick = () =>{
                        //get info about the message
                        const message = button.parentElement;
                        const content = message.dataset.content;
                        const messageTime = message.dataset.time;
                        const messageSender = message.dataset.user;
                        const messageChannel = localStorage.getItem('currentChannel');
                        //delete the content of the message
                        message.children[1].innerHTML="This message was deleted";
                        console.log(`${messageSender} requested to delete "${content}" from ${messageChannel}`)
                        socket.emit('delete',{'sender':messageSender,'channel':messageChannel,'content':content,'time':messageTime});
                    }
                });
                });

                socket.on('delete message',data=>{
                    const messageSender = data["sender"];
                    const channel = data["channel"];
                    const content = data["content"];
                    const time = data["time"];
                    console.log(`${messageSender} deleted a message`)

                    if(document.querySelectorAll(".received-message")){
                    document.querySelectorAll(".received-message").forEach(message=>{
                        if(message.dataset.time===time&&message.dataset.user===messageSender
                            && message.dataset.content===content && localStorage.getItem('currentChannel')===channel){
                            message.dataset.content="This message was deleted";
                            message.children[1].innerHTML="This message was deleted";
                        }
                    });
                    }
                });
                
            });