import React,{useState} from 'react'
import Chat from'./Chat'

export default function App(){
 const [user,setUser]=useState({name:" , room: "})
 const [joined,setJoined]= useState(false)

 function submit(e){
  e.preventDefault()
  if(!user.name.trim()||!user.room.trim())return alert('Enter name and room')
  setJoined(true)
 }

 if(!joined){
  return (
   <div className="login">
    <h2>Prod Chat</h2>
    <form onSubmit={submit}>
    <input placeholder="Your name"value={user.name}onChange={e => setUser({...user,name:
e.target.value})}/>
    <input placeholder="Room name (eg:general)"value={user.room}onChange={e =>
setUser({...user,room:e.target.value})}/>
    <button type="submit">Join</button>
   </form>
  </div>
 )
}

return <Chat name={user.name} room={user.room}/>
}