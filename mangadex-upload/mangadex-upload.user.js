// ==UserScript==
// @name         MangaDex upload
// @namespace    https://github.com/ewasion
// @version      0.1.0
// @license      CC-BY-NC-SA-4.0
// @description  Highly customizable upload script for MangaDex
// @author       Eva
// @match        https://mangadex.com/upload/*
// @icon         https://mangadex.com/favicon.ico
// @homepage     https://ewasion.github.io/userscripts/mangadex-upload/
// @updateURL    https://raw.githubusercontent.com/ewasion/userscripts/master/mangadex-upload/mangadex-upload.meta.js
// @downloadURL  https://raw.githubusercontent.com/ewasion/userscripts/master/mangadex-upload/mangadex-upload.user.js
// @grant        none
// ==/UserScript==

function uploadLog(message, display) {
  $('<p>', {
    text: message,
    class: display
  }).appendTo($('#logs'));
}

function processFiles() {
  let filepicker = $("#files");
  if(filepicker.get(0).files.length === 0) {
    return alert('You must select at least one file');
  }
  if(!$('#fallback_manga').val()) {
    return alert('You must select a fallback manga');
  }
  let names = [];
  for (var i = 0; i < filepicker.get(0).files.length; ++i) {
    names.push(filepicker.get(0).files[i].name);
  }

  let chapter_titles = {};
  let manga_db = {};
  let group_db = {};
  ['#chapter_titles', '#manga_db', '#group_db'].forEach(function(db) {
    $(db).val().split('\n').forEach(function(line) {
      const split = line.split(/(\d+):(.+)/);
      if(split[1] && split[2]) {
        if(db == '#chapter_titles') chapter_titles[split[1]] = split[2];
        if(db == '#manga_db') manga_db[split[2].toLowerCase()] = split[1];
        if(db == '#group_db') group_db[split[2].toLowerCase()] = split[1];
      }
    });
    if(db == '#manga_db') localStorage.setItem('manga_db', JSON.stringify(manga_db));
    if(db == '#group_db') localStorage.setItem('group_db', JSON.stringify(group_db));
  });

  const regParts = $('#regex').val().match(/^\/(.*?)\/([gmiyu]*)$/);
  const regex = regParts ? new RegExp(regParts[1], regParts[2]) : new RegExp($('#regex').val());
  let uploads = [];

  const lang = $('#lang_id').val();
  const fallback_group = $('#group_id').val() ? $('#group_id').val() : 2;
  const fallback_manga = $('#fallback_manga').val();
  names.forEach(function(name, index) {
    const matches = regex.exec(name + name);
    if(matches) {
      let manga = false;
      Object.keys(manga_db).forEach(function(index) {
        if(name.toLowerCase().includes(index)) {
          manga = manga_db[index];
        }
      });
      const manga_id = manga ? manga : fallback_manga;
      const group = !matches[4] ? matches[1] : matches[4];
      const group_id = Object.keys(group_db).includes(group.toLowerCase()) ? group_db[group.toLowerCase()] : fallback_group;
      const chapter = matches[3].replace(/^0+(?=\d)/, '');
      const volume = matches[2].replace(/^0+(?=\d)/, '');
      const title = Object.keys(chapter_titles).includes(chapter.toString()) ? chapter_titles[chapter] : '';
      uploadLog('Added to the upload queue [' + group + '] Vol.' + volume + ' Ch.' + chapter + ' (' + name + ') {' + index + '}', 'normal');

      let upload = new FormData();
      upload.append('manga_id', manga_id);
      upload.append('volume_number', volume);
      upload.append('chapter_number', chapter);
      upload.append('chapter_name', title);
      upload.append('group_id', group_id);
      upload.append('lang_id', lang);
      upload.append('file', filepicker.get(0).files[index]);
      uploads.push(upload);
    } else {
      uploadLog('Skipped. Regex doesn\'t match (' + name + ') {' + index + '}', 'warning');
    }
  });
  if(uploads.length > 0) {
    uploadFiles(uploads);
  } else {
    uploadLog('None of your files were uploaded', 'error');
  }
}

function uploadFiles(files) {
  const file = files[0];
  files.shift();
  $.ajax({
    url: "/ajax/actions.ajax.php?function=chapter_upload",
    type: 'POST',
    data: file,
    cache: false,
    contentType: false,
    processData: false,

    xhr: function() {
      var myXhr = $.ajaxSettings.xhr();
      if (myXhr.upload) {
        myXhr.upload.addEventListener('progress', function(e) {
          if (e.lengthComputable) {
            $('#progressbar_m').show();
            $('#progressbar_m').width((Math.round(e.loaded/e.total*100) + '%'));
          }
        } , false);
      }
      return myXhr;
    },

    success: function (data) {
      uploadLog('Uploaded  [' + file.get('group_id') + '] Vol.' + file.get('volume_number') + ' Ch.' + file.get('chapter_number') + ' (' + file.get('file').name + ')', 'success');
      $('#progressbar_m').hide();
      $('#progressbar_m').width('0%');
      if(files.length > 0) {
        uploadFiles(files);
      } else {
        uploadLog('Upload complete', 'info');
      }
    },

    error: function(err) {
      uploadLog('Upload failed [' + file.get('group_id') + '] Vol.' + file.get('volume_number') + ' Ch.' + file.get('chapter_number') + ' (' + file.get('file').name + ')', 'error');
    }
  });
}

/* Display mass upload form */
(function() {
  'use strict';
  let langpicker = $('#lang_id');
  let grouppicker = $('#group_id');
  let actions = $('#upload_form > div:last-child').prev();
  $('#upload_form').remove(); /* Get rid of the low effort upload form */

  let mangadex_uploader = $('<div>', {id: 'mangadex_uploader'});

  /* Fancy title */
  let title = $('.panel:last-child .panel-title');
  let titleicon = title.find('span');
  title.text(' Mass upload');
  title.prepend(titleicon);

  /* Make it look pretty */
  $('<style>', {text: `
#mangadex_uploader label:not(:first-child), #mangadex_uploader button[type="submit"], #mangadex_uploader a[role="button"] {
  margin-top: 20px;
}

#logs:empty::before {
  content: 'Logs will show up here.';
  color: #ccc;
}

#mangadex_uploader::before {
  display: block;
  content: 'MangaDex uploader 0.1.0';
  margin-bottom: 10px;
  color: rgba(255, 255, 255, .3);
}

#progressbar_m:not([style="width: 0%;"]) {
  height: 38px;
  border-radius: 5px;
  margin-top: 80px;
  float: none;
}

label {
  display: block;
}

#files {
  color: #999;
}

#logs .success {
  color: green;
}

#logs .error {
  color: red;
}

#logs .warning {
  color: orange;
}

#logs .info {
  color: cyan;
}

#logs .normal {
  color: #ccc;
}
`}).appendTo('head');

  /* Files */
  $('<label>', {
    for: 'files',
    text: 'Files'
  }).appendTo(mangadex_uploader);
  $('<input>', {
    type: 'file',
    id: 'files',
    multiple: ''
  }).appendTo(mangadex_uploader);

  /* Regex */
  $('<label>', {
    for: 'regex',
    text: 'Regex'
  }).appendTo(mangadex_uploader);
  $('<input>', {
    type: 'text',
    class: 'form-control',
    id: 'regex',
    placeholder: 'Regex',
    value: /.*?(?:\[([^\]]+)\].*)?v[^\d]*?(\.?\d+(?:\.\d+)*[a-zA-Z]?).*?c[^\d]*?(\.?\d+(?:\.\d+)*[a-zA-Z]?).*?(?:\[([^\]]+)\].*)?\.(?:zip|cbz)$/i
  }).appendTo(mangadex_uploader);

  /* Fallbacks */
  $('<label>', {
    for: 'fallback_manga',
    text: 'Fallback manga ID'
  }).appendTo(mangadex_uploader);
  $('<input>', {
    type: 'number',
    class: 'form-control',
    id: 'fallback_manga',
    placeholder: 'Fallback manga ID'
  }).appendTo(mangadex_uploader);

  $('<label>', {
    for: 'group_id',
    text: 'Fallback group'
  }).appendTo(mangadex_uploader);
  grouppicker.appendTo(mangadex_uploader);

  /* Language */
  $('<label>', {
    for: 'lang_id',
    text: 'Language'
  }).appendTo(mangadex_uploader);
  langpicker.appendTo(mangadex_uploader);

  /* Chapter titles */
  $('<label>', {
    for: 'chapter_titles',
    text: 'Chapter titles'
  }).appendTo(mangadex_uploader);
  $('<textarea>', {
    class: 'form-control',
    id: 'chapter_titles',
    placeholder: `1:Naruto Uzumaki!!
2:Konohamaru!!
3:Sasuke Uchiha!!
4:Kakashi Hatake!!
5:Unpreparedness is One's Greatest Enemy!!`
  }).appendTo(mangadex_uploader);

  /* Manga DB */
  $('<label>', {
    for: 'manga_db',
    text: 'Manga DB'
  }).appendTo(mangadex_uploader);
  $('<textarea>', {
    class: 'form-control',
    id: 'manga_db',
    placeholder: `5:naruto
153:detective conan
188:nichijou
69:xblade`
  }).appendTo(mangadex_uploader);

  /* Group DB */
  $('<label>', {
    for: 'group_db',
    text: 'Group DB'
  }).appendTo(mangadex_uploader);
  $('<textarea>', {
    class: 'form-control',
    id: 'group_db',
    placeholder: `1334:iem
621:fh
128:inp mangaz
1196:kefi
1335:wtf
645:bushido
577:binktopia
937:inane
1370:project_88
1371:wek`
  }).appendTo(mangadex_uploader);

  /* Back/upload buttons */
  actions.find('#upload_button').attr('id', 'start_uploading');
  actions.find('[href^="/manga/"]').attr('href', '#');
  actions.appendTo(mangadex_uploader);

  /* Progress bar */
  $('<div>', {
    id: 'progressbar_m',
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-valuenow': '0',
    style: 'width: 0%;',
    class: 'progress-bar progress-bar-info'
  }).appendTo(mangadex_uploader);

  /* Logs */
  $('<label>', {
    text: 'Logs'
  }).appendTo(mangadex_uploader);
  $('<div>', {
    id: 'logs'
  }).appendTo(mangadex_uploader);

  mangadex_uploader.appendTo('.panel:last-child .panel-body');
  ['manga_db', 'group_db'].forEach(function(db) {
    if(localStorage.getItem(db)) {
      let text = '';
      const entries = JSON.parse(localStorage.getItem(db));
      Object.keys(entries).forEach(function(entry) {
        text += entries[entry] + ':' + entry + '\n';
      });
      $('#' + db).val(text);
    }
  });
  $('#start_uploading').click(function() {processFiles();});
})();