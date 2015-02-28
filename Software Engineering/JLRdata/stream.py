from tweepy import Stream
from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
import time
import os
from sys import exit
import json

ckey = 'lqg1QpaKYl81Xb6qgUhTREfPh'
csecret = 'LGiMUtXhbQ0ie3ZDzamvuar2rkD8DXasUrYxXgZf1Z9KLMk74m'
atoken = '308173258-aKYnB7seAYFajxnIJuxXmqnwNvK15kq7ippZzDdb'
asecret	= 'HremoM5vZ94wtAtH0QDDLd34H5KiNPKDwqvUMQRz39eD7'


#Creating a listener class
class listener(StreamListener):

	#Collecting the on_data
	def on_data(self, data):
			try:
				os.remove('tweetDB.html');
				## MAY WANT TO SPLIT MORE DATA THAN JUST TWEET IN THE FUTURE, LIKE USERNAME AND LOCATION
				tweet = data.split(',"text":"')[1].split('","source')[0] #Split the data into just the tweet

				############################################################### This is creating a JSON file
				#os.remove('tweet-json.JSON');
				#new_tweet = '[{""message"" : ""Good morning, World!""}]';
				#tweet_json = open("tweet-json.JSON", "w");
				#json.dump(new_tweet, tweet_json, indent=4);
				#tweet_json.close()
				###############################################################

				saveThis = str(time.time())+'::'+tweet #Get the time, add the tweet, NEED to add location
				saveFile = open('tweetDB.html', 'a') #Save file with intention to append
				saveFile.write("<li>"+saveThis+"</li>") #Write incoming data to the file
				saveFile.write('\n') #New line to separate the data
				saveFile.close() #Close tweetDB
				os.startfile('tweetDB.html')
				time.sleep(2)
				raise SystemExit
				return True
			except BaseException, e:
				print 'failed ondata',str(e)
				time.sleep(5) #Just in case you did get limited error

	def on_error(self, status):
		print status #Print the status



#Giving authorization for ourselves
auth = OAuthHandler(ckey, csecret)
auth.set_access_token(atoken, asecret)
twitterStream = Stream(auth, listener())

#Filtering the data that we want to show up
twitterStream.filter(track=["good morning"]) 
#twitterStream.filter(locations=[-122.75,36.8,-121.75,37.8])