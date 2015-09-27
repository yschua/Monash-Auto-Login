// ==UserScript==
// @name         Monash Auto Login
// @namespace    https://github.com/yschua/monash-auto-login
// @version      0.5
// @description  Save login credentials and automatic login
// @author       yschua
// @include      https://*.monash.*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// @require      http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/pbkdf2.js
// @require      http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js
// @updateURL    https://raw.githubusercontent.com/yschua/monash-auto-login/master/auto-login.user.js
// @downloadURL  https://raw.githubusercontent.com/yschua/monash-auto-login/master/auto-login.user.js
// ==/UserScript==

GM_registerMenuCommand("Delete Login", deleteAll);

var main = window.location.href.match(/https:\/\/login\.monash\.edu\/.*/i);
var wes = window.location.href.match(/https:\/\/my\.monash\.edu\.au\/wes\/.*/i);
var userNameInput = (wes) ? "username" : "userNameInput";
var passwordInput = (wes) ? "password" : "passwordInput";

if (main || wes) {
  if (GM_getValue("usernameTmp")) {
    deleteAll();
  }

  if (GM_listValues()[1]) {
    if (!GM_getValue("attempts")) {
      GM_setValue("attempts", 0);
    }
    var att = GM_getValue("attempts");

    if (att > 1) {
      deleteAll();
    } else {
      document.getElementById(userNameInput).value = decrypt("username");
      document.getElementById(passwordInput).value = decrypt("password");
      //GM_log(att);
      GM_setValue("attempts", ++att);
      if (wes) {
        document.getElementsByTagName('input')[6].click();
      } else {
        Login.submitLoginRequest();
      }
    }
  }
} else {
  if (GM_getValue("attempts")) {
    GM_deleteValue("attempts");
  }
  if (GM_getValue("usernameTmp")) {
    if (confirm("Do you want to save your login details?")) {
      saveLogin();
    } else {
      deleteAll();
    }
  }
}

if (main) {
  document.getElementById("loginForm").addEventListener("click", function() {
    saveLoginTemp();
  });

  document.getElementById("loginForm").addEventListener("keydown", function() {
    saveLoginTemp();
  });
} /*else if (wes) {
  document.getElementsByTagName("input")[6].onclick = function() {
    saveLoginTemp();
  }
}*/

function saveLoginTemp() {
  var username = document.getElementById(userNameInput).value;
  username = username.replace(/Monash\\/, "")
  var password = document.getElementById(passwordInput).value;
  generateKey(username + password);
  encryptAndSave("usernameTmp", username);
  encryptAndSave("passwordTmp", password);
}

function saveLogin() {
  GM_setValue("username", GM_getValue("usernameTmp"));
  GM_setValue("password", GM_getValue("passwordTmp"));
  GM_deleteValue("usernameTmp");
  GM_deleteValue("passwordTmp");
}

function deleteAll() {
  var keys = GM_listValues();
  for (var i = 0, key = null; key = keys[i]; i++) {
    GM_deleteValue(key);
  }
}

function generateKey(s) {
  var salt = CryptoJS.lib.WordArray.random(128 / 8);
  var key = CryptoJS.PBKDF2(s, salt, { keySize: 512 / 32, iterations: 10 });
  var iv = CryptoJS.lib.WordArray.random(128 / 8);
  GM_setValue("key", key);
  GM_setValue("iv", iv);
}

function encryptAndSave(name, value) {
  var key = GM_getValue("key");
  var iv = GM_getValue("iv");
  var enc = CryptoJS.AES.encrypt(value, key, { iv: iv });
  GM_setValue(name, enc.toString());
}

function decrypt(name) {
  var key = GM_getValue("key");
  var iv = GM_getValue("iv");
  var enc = GM_getValue(name);
  var dec = CryptoJS.AES.decrypt(enc, key, { iv: iv });
  return dec.toString(CryptoJS.enc.Utf8);
}
