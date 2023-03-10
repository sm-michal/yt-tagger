// ==UserScript==
// @name     YoutubeTagger
// @version  0.1
// @grant    none
// @include https://*youtube.com/*
// ==/UserScript==

var db;

const currentVideo = new URLSearchParams(window.location.search).get('v')

const request = window.indexedDB.open('YoutubeTagger', 1);
request.onerror = (event) => { alert(event) }
request.onsuccess = (event) => {
  db = event.target.result
  db.onerror = (event) => { alert('Database error: ${event.target.errorCode}') }
}

request.onupgradeneeded = (event) => {
	db = event.target.result;
  db.onerror = (event) => { alert('Database error: ${event.target.errorCode}') }

  const tagsStore = db.createObjectStore("tags", { keyPath: "url"});
  tagsStore.transaction.oncomplete = (event) => {
    db.transaction("tags", "readwrite").objectStore("tags");
  }
}


function closeDiv() {
  var div = document.getElementById('tagContainer');
  var style = div.getAttribute('style');
  div.setAttribute('style', style + 'display: none;');
}

function addTag() {
  player = document.getElementsByClassName("html5-main-video")[0];
  player.pause();

  var div = document.getElementById('tagContainer');
  if (div) {
    var style = div.getAttribute('style');
    console.log(style);
    div.setAttribute('style', style.replace('display: none;', ''));
  }
  else {
    div = document.createElement('div');
  	div.id = 'tagContainer';
    div.setAttribute('style', 'position: absolute; top: 56px; z-index:1000; background-color:white; opacity:0.5; height: 56.25vw; width:1705px;');

    var closeButton = document.createElement('input');
    closeButton.setAttribute('style', 'position:absolute; right:0px;');
    closeButton.type = 'button';
    closeButton.value = 'X';
    closeButton.onclick = closeDiv;
    div.appendChild(closeButton);

    var formContainer = document.createElement('div');
    formContainer.setAttribute('style', 'margin: auto; width:25%; height:50%; background-color:grey;');
    div.appendChild(formContainer);

    var form = document.createElement('form');
    form.id = 'dataForm';
    formContainer.appendChild(form);

    var tagInput = document.createElement('input');
    tagInput.id = 'tagName';
    formContainer.appendChild(tagInput);

    var submitButton = document.createElement('input');
    submitButton.type = 'button';
    submitButton.value = 'Submit';
    submitButton.onclick = saveTag;
    formContainer.appendChild(submitButton);


    document.body.insertBefore(div, document.body.firstChild);
  }

}

function saveTag() {
  var tagText = document.getElementById('tagName').value;
  var tagTime = document.getElementsByClassName("html5-main-video")[0].currentTime;

  const tagsStore = db.transaction(["tags"], "readwrite").objectStore("tags")
  const request = tagsStore.get(currentVideo);
  request.onsuccess = (event) => {
    var data = event.target.result;
    if (!data) {
      data = {
      	url: currentVideo,
        tags: []
      };
    }

    const nData = JSON.parse(JSON.stringify(data));
    nData.tags.push({
    	time: tagTime,
      text: tagText
    });

    const requestUpdate = tagsStore.put(nData);
    requestUpdate.onsuccess = (event) => {
      closeDiv();
    }
  }
}

if(window.location.href.indexOf("v=") > 0) { //If it is a valid video
  var tagButton = document.createElement('input');
  tagButton.type = 'button';
  tagButton.value = 'Tag';
  tagButton.onclick = addTag;

	var parent = document.getElementsByClassName('ytp-chrome-controls')[0]
  parent.append(tagButton);

  setTimeout(showTags, 500);
}
else {
	var tagsInterval = setInterval(addTagsEntry, 1000);
}

function showTags() {
  db.transaction(["tags"]).objectStore("tags").get(currentVideo).onsuccess = (event) => {
  	if (event.target.result) {
    	console.log(event.target.result);
    }
  }
}

function getTags(handler) {
  db.transaction(["tags"]).objectStore("tags").openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      handler(cursor.key, cursor.value);
      cursor.continue();
    }
  }
}


function addTagsEntry() {
  var container = document.getElementById('guide-inner-content').querySelector('#items');
  if (!container || container.children.length < 4) {
    return;
  }
  clearInterval(tagsInterval);

  var tagContainer = document.createElement('div');
  tagContainer.id = 'tagsList';
  tagContainer.setAttribute('style', 'display: none; z-index:3000; background-color: black; position: absolute; top:0; opacity:0.8; width: 1705px;');

  var list = document.createElement('ul');
  list.setAttribute('style', 'float: left; font-size: 1.4rem; margin-left: 20px;');
  list.id = 'tagsListUl';
  tagContainer.append(list);

  document.body.insertBefore(tagContainer, document.body.firstChild);

  var elem = container.children[container.children.length - 1];


  var tagsEntry =  document.createElement('input');
  tagsEntry.value = 'Custom tags';
  tagsEntry.type = 'button';
  tagsEntry.onclick = showTagList;

  container.insertBefore(tagsEntry, elem);
}

function showTagList() {
  var tagsList = document.getElementById('tagsList');
  if (tagsList) {
    tagsList.setAttribute('style', tagsList.getAttribute('style').replace('display: none;', ''));


    getTags(handleShowTag);

  }
}

function handleShowTag(key, value) {
  const listElem = document.getElementById('tagsListUl');

  value.tags.forEach(tag => {
    var tagElem = document.createElement('li');
  	var link = document.createElement('a');
  	link.href = `https://www.youtube.com/watch?v=${key}&t=${parseInt(tag.time)}`;
    link.innerHTML = tag.text;
    tagElem.append(link);

    listElem.append(tagElem)
  });

}
