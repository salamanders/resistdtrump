/*globals gapi, sheetToObject, ga */
/*jshint esversion: 6, unused:true  */

const 
  SHEET_DISCOVERY = 'https://sheets.googleapis.com/$discovery/rest?version=v4',
  API_KEY = 'AIzaSyChUJWkShIsFEzFwTnRK4tr_-Y6grZdxUs',
  SHEET_ID = '1c8uV4RhuHkt5fnNB0E_Q-pg0fYEFq7Csk9xK5Jq3ZX4',
  DISBELIEF = [
    "Augh",
    "But why",
    "Facepalm",
    "Hell no",
    "I can't believe it",
    "Just... no",
    "No way",
    "Seriously",
    "That is insane",
    "That stinks",
    "Unreal",
    "What the hell",
    "You are kidding me",
    "You must be joking"
  ];

var data = {};

Promise.resolve().then(function(){
  console.info('init lib load');
  return new Promise(function (resolve) {
    console.info('starting lazyLoadGapi promise.');
    if (window.gapi && window.gapi.client) {
      console.info('lazyLoadGapiCallback: Already had gapi.client loaded.');
      resolve();
    } else {
      // Bug with callback?
      let backupCheck = window.setTimeout(function(){
        if(window.gapi && window.gapi.client) {
          console.info('backup lazyLoadGapiCallback');
          backupCheck = null;
          resolve();
        } else {
          console.warn('backupCheck did not have client loaded.');
        }
      }, 1000);
      window.lazyLoadGapiCallback = function () {
        if(backupCheck) {
          clearTimeout(backupCheck);
          backupCheck = null;
        }
        console.info('lazyLoadGapiCallback: done, gapi=' + JSON.stringify(Object.keys(gapi)));
        resolve();
      };
      console.info('Set up lazyLoadGapiCallback listener.');
    }
  });
}).then(function(){
  gapi.client.setApiKey(API_KEY);
  return gapi.client.load(SHEET_DISCOVERY);
}).then(function(){
  return gapi.client.sheets.spreadsheets.get({
    'spreadsheetId': SHEET_ID,
    'includeGridData': true,
    'fields': 'sheets(properties(title,gridProperties),data(rowData(values(formattedValue))))'
  });
}).then(function(response){
  data = sheetToObject(response.result);
  console.log(data);
  showRandomAction();
}).catch(function (err) {
  alert('Error in script, please see console.');
  console.error(err);
  throw err;
});

function showRandomAction() {
    // action: Show what happened.
  let action = data.action[Math.floor(Math.random()*data.action.length)];
  let actionText = '';
  if(action.when) {
    let when = new Date(action.when), 
    now = new Date(),
    daysAgo = Math.round((now-when)/(1000*60*60*24));
    actionText += daysAgo + ' days ago ';
  }
  if(action.who) {
    actionText += ' ' + action.who + ' ';
  }
  actionText += ' ' + action.what + ' ';
  document.querySelector('#card .mdl-card__title-text').textContent = actionText;

  // What is this action tagged with? Look for emojis.
  let actionTags = Object.keys(action).filter(function(actionKey){
    return 'Y' == action[actionKey];
  }).map(textToEmojiSpan).join(',');
  document.querySelector('#action_tag').innerHTML = actionTags ? actionTags : 'this';

  document.querySelectorAll('#card .mdl-card__actions').forEach(function(node){
    node.parentNode.removeChild(node);
  });

  // resist: What you can do. 
  var t = document.querySelector('#action');

  data.resist.filter(function(r) {
    return r.how && r.requires && r.resistance;
  }).filter(function(r){
    return action[r.threat] || !r.threat;
  }).forEach(function(r){
    t.content.querySelector('a').textContent = r.resistance;
    t.content.querySelector('a').href = 'https://www.google.com/search?q=' + encodeURIComponent(r.how) + '&btnI=I';
    t.content.querySelector('.requires').innerHTML = textToEmojiSpan(r.requires);
    var clone = document.importNode(t.content, true);
    document.querySelector('#card').appendChild(clone);
  });

  trackOutboundClicks();
  document.querySelector('#disbelief').textContent = DISBELIEF[Math.floor(Math.random()*DISBELIEF.length)] + ', ';
}

/** Because we can't forEach a NodeList :( */
var forEach = function (array, callback, scope) {
  for (var i = 0; i < array.length; i++) {
    callback.call(scope, i, array[i]); // passes back stuff we need
  }
};

function trackOutboundClicks() {
  forEach(document.querySelectorAll('a'), function (index, value) {
    if(!value.onclick && value.href) {
      let url = value.href;
      value.onclick = function() {
       ga('send', 'event', 'outbound', 'click', url, {
         'transport': 'beacon',
         'hitCallback': function(){document.location = url;}
       });
       return false;
      };
      console.info(`Outbound click track enabled on ${url}`);
    }
  });
}

function initUI() {
  document.querySelector('#more').onclick = showRandomAction;
}

function textToEmojiSpan(text) {
  let emoji = text.substr(0,text.indexOf(' ')),
    title = text.substr(text.indexOf(' ')+1);
  return `<span title="${title}">${emoji}</span>`;
}

if (document.readyState === 'complete' || document.readyState === 'loaded') {
  initUI();
} else {
  document.addEventListener('DOMContentLoaded',function(){
    initUI();
  });  
}

console.info('code:end');