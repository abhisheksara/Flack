import os
import requests

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_socketio import SocketIO, emit
from datetime import datetime

app = Flask(__name__)

socketio = SocketIO(app)
app.config["SECRET_KEY"]="mysecretkeyflack"

#create class of messages
class Message:
	def __init__(self, sender, channel, message, time):
		self.sender=sender
		self.channel=channel
		self.message=message
		self.time=time


#create class of channels
class Channel:
	def __init__(self,name):
		self.name = name
		self.messages = []#list of Message objects
	
	def newMessage(self, message):
		limit=100 #no of msgs per channel to be stored
		if len(self.messages>=100):
			self.messages.pop(0)
		self.messages.append(message)

channels=[] #this is a list of channel objects

@app.route("/")
def index():

	try:
		channel=session["channel"]
		channelName=channel.name
		messageDictList=[]#list of messages where each message is a dict
		return render_template('index.html', displayName=session['displayName'], channelName=channelName, messages=messageDictList, channels=[channel.name for channel in channels])
	#if user did not visit any channel
	except Exception:
		try:
			try:
				print(session["channel"].name)
			except:
				print("sorry")	
			return render_template('index.html', displayName=session['displayName'],  channelName="Home", messages=[], channels=[channel.name for channel in channels])
	#if user did not visit any channel channels=[channel.name for channel in channels])		
		#if user not in session, prompt login
		except Exception:
			return redirect(url_for('login'))

@app.route("/login",methods=["GET","POST"])
def login():
	if request.method=='GET':
		return render_template('login.html',h1_message="Choose a display name")
	else:
		session.clear()
		displayName = request.form.get('name')
		session['displayName']=displayName
		return jsonify({'success':True})

@socketio.on('new channel')
def createChannel(data):
	channelName=data["channelName"]
	newChannel=Channel(channelName)#created new Channel object
	channels.append(newChannel)
	emit("create channel", {"channelName":channelName}, broadcast=True)

@socketio.on('get channel')
def getChannel(data):
	channelName = data["channelName"]
	session["channel"] = [channel for channel in channels if channel.name==channelName][0]#gets the Channel object
	channel=session["channel"]
	messages=channel.messages
	messageDictList=[{'sender':msg.sender, 'time':msg.time, 'content':msg.message} for msg in messages]#list of messages where each message is a dict
	print(messageDictList)
	emit("show channel",{'channelName':channelName,'messages':messageDictList})

@socketio.on('new message')
def newMessage(data):
	now = datetime.now()
	time = now.strftime("%d/%m/%Y %H:%M")
	channelName=data["channelName"]
	sender = data["sender"]
	content = data["message"]
	channel = session["channel"]#channel object
	msg=Message(sender,channel,content,time)
	if(len(channel.messages)>=100):
		channel.messages.pop(0)
	channel.messages.append(msg)
	emit('broadcast message',{'sender':msg.sender, 'time':msg.time, 'channel':channelName, 'content':msg.message}, broadcast=True)

@socketio.on('delete')
def deleteMessage(data):
	sender = data["sender"]
	content = data["content"]
	messageTime = data["time"]
	channelName = data["channel"]
	print(f'Data from client is {sender} "{content}" {messageTime} {channelName}')
	channel = [channel for channel in channels if channel.name==channelName][0]
	for message in channel.messages:
		print(message.sender)
		print(message.channel.name)
		print(message.message)
		print(message.time)
		
		if(message.sender==sender and message.channel.name==channelName and message.message==content and message.time==messageTime):
			message.message="This message was deleted"
			print("deleted a message")
		else:
			print("message not found")	
	emit('delete message',{'sender':sender,'channel':channelName,'content':content,'time':messageTime},broadcast=True)	

if __name__=='__main__':
   	socketio.run(app)    		