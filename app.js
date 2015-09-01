var page = require('webpage').create();
var system = require('system');
var loadInProgress = false;
var testindex = 0;
var start;

if (system.args.length > 1) {
  var url = Array.prototype.slice.call(system.args, 1).join('');
  page.onLoadStarted = function() {
    start = new Date;
    console.log('start loading page...');
    loadInProgress = true;
  }

  page.onLoadFinished = function() {
    var ms = new Date - start;
    var hasWptCookie = false;
    var cookies = page.cookies;

    for (var i in cookies) {
      if (cookies[i].name === 'wpt_ing2') {
        hasWptCookie = true;
      }
    }

    // 提交form表单后，页面会通过轮询调用`/ajax-querywpt.php`接口判断是否已完成评测，并且此时cookie`wpt_ing2`有值
    // 当`data.status == 'complete'`时，删除cookie为`wpt_ing2`的值，并且重新reload页面
    // 所以这里利用是否存在这个值延长截图函数的等待
    if (!hasWptCookie) {
      loadInProgress = false;
    }
    console.log('finish loading page, current page url is: ' + page.url + ', spend ' + ms + ' ms');
  }

  var steps = [
    function() {
      page.open('http://www.alibench.com/');
    },
    function() {
      page.evaluate(function(url) {
        var form = document.getElementById('global-form');
        form.elements['global-form-input'].value = url;
        form.elements['sb-trace-start-btn'].click();
        return document.title;
      }, url);
      loadInProgress = true;
    },
    function() {
      page.render(new Date().getTime() + '.png');
    }
  ];

  var interval = setInterval(function() {
    if (!loadInProgress && typeof steps[testindex] == 'function') {
      steps[testindex]();
      testindex++;
    }
    if (typeof steps[testindex] != 'function') {
      phantom.exit();
    }
  }, 10);
}