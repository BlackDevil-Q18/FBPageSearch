
var FBUtil = (function () {
        "use strict";

        function mergeArr(a, b) {
                if (Array.isArray(a) && Array.isArray(b)) {
                        a = b.reduce(function (arr, val) {
                                arr.push(val);
                                return arr;
                        }, a);
                }
        }


        function mergeObj(a, b) {
                (Object.keys(b)).forEach(function (_key) {
                        if (typeof a[_key] === "undefined") {
                                a[_key] = b[_key];
                        }
                });
        }


        function _drawActions(actions, bindThis) {
                var actionsHTMLCont = document.createElement("div");
                actionsHTMLCont.setAttribute("class", "action-cont");
                actions.forEach(function (_actionDetails) {
                        var _actionEl = document.createElement("div");
                        _actionEl.setAttribute("class", "action fa fa-" + _actionDetails.icon);
                        _actionEl.setAttribute("data-action", _actionDetails.op);

                        _actionEl.addEventListener('click', _actionDetails.action.bind(bindThis));

                        actionsHTMLCont.appendChild(_actionEl);
                });
                return actionsHTMLCont;
        }


        function _doGet(url,success,failure){
                var _ajaxCall = new XMLHttpRequest();
                        _ajaxCall.onreadystatechange = function () {
                                if (this.readyState == 4) {
                                        if (this.status == 200) {
                                                success(JSON.parse(this.responseText));
                                        } else {
                                                failure(JSON.parse(this.responseText));
                                        }
                                }
                        };
                        _ajaxCall.open("GET", url, true);
                        _ajaxCall.send();
                return _ajaxCall;
        }


        return {
                merge: function (a, b) {
                        if (Array.isArray(a) && Array.isArray(b)) {
                                mergeArr(a, b);
                        }else if (typeof a === 'object' && typeof b === 'object') {
                                mergeObj(a, b);
                        } 
                },
                createEL: function (tagName, classList) {
                        var _el = document.createElement(tagName);
                        _el.setAttribute('class', classList);
                        return _el;
                },
                drawActions: function (actions, bindThis) {
                        return _drawActions(actions, bindThis);
                },
                ajaxGet : function(url,success,failure){
                        _doGet(url,success,failure);
                }
        }
})();
