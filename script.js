/**
Parts of this code via CodePen
Copyright (c) 2021 by Nikolay Talanov (https://codepen.io/suez/pen/MaeVBy)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

The rest is (c) 2021, Crossword Nexus.  Also MIT license.
https://mit-license.org/
**/

$(document).ready(function() {

  var animating = false;
  var cardsCounter = 0;
  var numOfCards = 100;
  var decisionVal = 80;
  var pullDeltaX = 0;
  var deg = 0;
  var saveFileName;
  var $card, $cardReject, $cardLike;

  var my_dictionary = {};

  // determine what happens when we choose a file
  document.getElementById('files').addEventListener('change', handleFileSelect, false);

  function createCards() {
      /**
      * function to take some random words from the dictionary and display them
      **/
      var subset = [];
      var myKeys = Object.keys(my_dictionary);
      var dict_length = myKeys.length;
      var randomNumbers = d3.shuffle(d3.range(dict_length));
      for (var i=0; i < d3.min([numOfCards, dict_length]); i++) {
          var word = myKeys[randomNumbers[i]];
          //console.log(myObj);
          var score = my_dictionary[word];
          // restricting to 15-letter words or less, for now
          if (word.length <= 15) {
              addToStack(word, score);
          }
      }
  }

  function saveList() {
      /* save the user's list */
      // Make text from the dictionary
      var myText = '';
      Object.keys(my_dictionary).forEach((word, ix) => {
          if (word) {
              var score = my_dictionary[word];
              myText += `${word};${score}\n`;
          }
      });
      // Generic stuff to save file; could be split out but eh
      var file = new Blob([myText], {type: 'text'});
      if (window.navigator.msSaveOrOpenBlob)
          window.navigator.msSaveOrOpenBlob(file, saveFileName);
      else {
          var a = document.createElement("a"),
                  url = URL.createObjectURL(file);
          a.href = url;
          a.download = saveFileName;
          document.body.appendChild(a);
          a.click();
          setTimeout(function() {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
          }, 0);
      }
      // We maybe also want to clear the stack once we've done this? TBD
  }

  function handleFileSelect(evt) {
      /** event that we fire when a word list is selected **/
      var files = document.getElementById('files').files; // FileList object

      // files is a FileList of File objects.
      for (var i = 0, f; f = files[i]; i++) {

          // Only process small files.
          //if (f.size >= 7500) {
          if (false) {
              alert('This file is too big.');
              continue;
          }
          if (f) {
              var r = new FileReader();
              var filename = f.name;
              saveFileName = filename;
              r.onload = (function(theFile) {
                  return function(e) {
                      var contents = e.target.result;
                      contents.split('\n').forEach(function(row, ix) {
                          var word = row.split(';')[0];
                          var score = parseInt(row.split(';')[1]);
                          if (word) {
                              my_dictionary[word] = score;
                          }
                      });
                      // Populate the cards from the dictionary
                      createCards(my_dictionary);
                      // Once we create the cards we add a button to save the word list
                      document.getElementById("save_list").innerHTML = '<button type="button" id="save_button">Save List</button>';
                      // Add a listener to this
                      document.getElementById('save_button').addEventListener('click', saveList, false);
                      // Remove the option to upload
                      document.getElementById('word_list_select').innerHTML = '';
                  };
              })(f);
              r.readAsBinaryString(f);
          } else {
              alert("Failed to load file");
          }
      }
  }

  // function to add elements to the stack
  function addToStack(word, score) {
      jQuery("#main_stack").append(`<div class="demo__card" id="card_${word}"></div>`);
      jQuery(`#card_${word}`).append(`<div class="demo__card__top cyan" id="top_${word}"></div>`);
      jQuery(`#top_${word}`).append(`<p class="demo__card__name" id="p_${word}"></p>`);
      jQuery(`#p_${word}`).text(word);
      jQuery(`#card_${word}`).append(`<div class="demo__card__btm" id="btm_${word}"></div>`);
      jQuery(`#btm_${word}`).append(`<p class="demo__card__we" id="we_${word}"></p>`);
      jQuery(`#we_${word}`).text(score);
      jQuery(`#card_${word}`).append(`<div class="demo__card__choice m--reject"></div>`);
      jQuery(`#card_${word}`).append(`<div class="demo__card__choice m--like"></div>`);
      jQuery(`#card_${word}`).append(`<div class="demo__card__drag"></div>`);

      // Attach our object (word / score) to this node
      // I don't know why I can't seem to do this in jQuery
      var div = document.getElementById(`card_${word}`);
      div.dictObject = {"word": word, "score": score};
      //console.log(div.dictObject);
  }

  function pullChange(e) {
    /* this is called while a card is being pulled */
    animating = true;
    deg = pullDeltaX / 10;
    $card.css("transform", "translateX("+ pullDeltaX +"px) rotate("+ deg +"deg)");

    var opacity = pullDeltaX / 100;
    var rejectOpacity = (opacity >= 0) ? 0 : Math.abs(opacity);
    var likeOpacity = (opacity <= 0) ? 0 : opacity;
    $cardReject.css("opacity", rejectOpacity);
    $cardLike.css("opacity", likeOpacity);
  };

  function swipeLeftAction(e) {
      /* the action when we swipe left */
      var thisDict = e.currentTarget.dictObject;
      var word = thisDict['word'];
      // for now just set to 45
      my_dictionary[word] = 45;
  }

  function swipeRightAction(e) {
      /* the action when we swipe right */
      var thisDict = e.currentTarget.dictObject;
      var word = thisDict['word'];
      // for now just set to 80
      my_dictionary[word] = 80;
  }

  function release(e) {
    /* called when the card is released */

    // determine if the card is going right or left
    if (pullDeltaX >= decisionVal) {
      $card.addClass("to-right");
      swipeRightAction(e)
    } else if (pullDeltaX <= -decisionVal) {
      $card.addClass("to-left");
      swipeLeftAction(e);
    }

    // if we've moved past the threshold
    if (Math.abs(pullDeltaX) >= decisionVal) {
      // add the "inactive" class
      $card.addClass("inactive");

      // move to the next card
      setTimeout(function() {
        $card.addClass("below").removeClass("inactive to-left to-right");
        cardsCounter++;
        // Determine what to do when we run out of cards
        if (cardsCounter === numOfCards) {
          cardsCounter = 0;
          $(".demo__card").removeClass("below");
        }
      }, 300);
    }

    // if we haven'e moved past the threshold
    if (Math.abs(pullDeltaX) < decisionVal) {
      $card.addClass("reset");
    }

    setTimeout(function() {
      $card.attr("style", "").removeClass("reset")
        .find(".demo__card__choice").attr("style", "");

      pullDeltaX = 0;
      animating = false;
    }, 300);
    //console.log(e);
    console.log(e.currentTarget);
  };

  $(document).on("mousedown touchstart", ".demo__card:not(.inactive)", function(e) {
    if (animating) return;

    $card = $(this);
    $cardReject = $(".demo__card__choice.m--reject", $card);
    $cardLike = $(".demo__card__choice.m--like", $card);
    var startX =  e.pageX || e.originalEvent.touches[0].pageX;

    $(document).on("mousemove touchmove", function(e) {
      var x = e.pageX || e.originalEvent.touches[0].pageX;
      pullDeltaX = (x - startX);
      if (!pullDeltaX) return;
      pullChange(e);
    });

    $(document).on("mouseup touchend", function() {
      $(document).off("mousemove touchmove mouseup touchend");
      if (!pullDeltaX) return; // prevents from rapid click events
      release(e);
    });
  });

});
