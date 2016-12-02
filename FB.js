
var FBPageSearch = (function () {
        "use strict";
        var _activeQuery = "",
                _activeSearchCall = null,
                _searchtResetCallback = null,
                _FBSearchBaseURL = baseURL + "search?type=page&limit=5&fields=id,picture,category,name,page,about,link,app_id,category_list,company_overview,description,cover";

        var FBSearchURL = "";
        var ajaxCount = 0;

        function _resetAjaxCount() {
                ajaxCount = 3
        }

        function _setupSearchURL() {
                FBSearchURL = _FBSearchBaseURL + "&q=" + encodeURIComponent(_activeQuery) + "&access_token=" + appToken;
        }

        function _cancelActiveSearch() {
                if (_activeSearchCall) {
                        _activeSearchCall.abort(); // cancel current Request
                }
        }


        function _doSearch(resolve, reject) {
                if (FBSearchURL != "") {
                        // _activeSearchCall = new XMLHttpRequest();
                        // _activeSearchCall.onreadystatechange = function () {
                        //         if (this.readyState == 4) {
                        //                 if (this.status == 200) {
                        //                         resolve(JSON.parse(this.responseText));
                        //                 } else {
                        //                         reject(JSON.parse(this.responseText));
                        //                 }
                        //         }
                        // };
                        // _activeSearchCall.open("GET", FBSearchURL, true);
                        // _activeSearchCall.send();
                        _activeSearchCall = FBUtil.ajaxGet(FBSearchURL,resolve, reject);
                } else {
                        reject("CUSTOM:NO:CRITERIA");
                }
        }

        function searchFB(options) {
                ajaxCount--;
                //ajax to Fb        
                if (_activeQuery != "") {
                        var searchPromise = new Promise(_doSearch);
                        searchPromise.then(function (result) {
                                options.success(result.data);
                                console.log(result.data);
                                FBSearchURL = result.paging.next;
                                if (ajaxCount > 0) {
                                        searchFB(options);
                                } else {
                                        _activeSearchCall = null;
                                }
                        }).catch(function (err) {
                                options.failure(err);
                        })
                } else {
                        options.failure("CUSTOM:NO:CRITERIA");
                }
        }

        function initSearch(queryText) {
                _activeQuery = queryText;
                _cancelActiveSearch();
                _setupSearchURL();
                _resetAjaxCount();

                if (_searchtResetCallback) {
                        _searchtResetCallback(queryText);
                }
        }


        return {
                search: function (queryText, options) {
                        initSearch(queryText);
                        searchFB(options);
                },
                getActiveQuery: function () {
                        return _activeQuery;
                },
                cancelActiveSearch: function () {
                        _cancelActiveSearch();
                },
                setSearchResetCallback: function (callback) {
                        if (typeof callback === 'function') {
                                _searchtResetCallback = callback;
                        }
                },
                nextPage: function (options) {
                        if (!_activeSearchCall) {
                                _resetAjaxCount();
                                searchFB(options);
                        }
                }
        }


})();




var SearchController = (function () {
        "use strict";
        var _resultListView = null,
                pageCol = null,
                searchHeader = null,
                resultHeading = null;

        var searchActionList = [{
                op: 'show_fav',
                icon: 'star',
                action: function (e) {
                        if (e.target.classList.contains('active')) {
                                _resultListView.redraw();
                        } else {
                                _resultListView.renderFav();
                        }
                        e.target.classList.toggle('active');
                }

        }]

        function _resetResultHeading(newSearchQuery) {
                resultHeading.innerHTML = "";
                var searchedFor = FBUtil.createEL('span', 'searched-for');
                searchedFor.innerText = SearchConstants.SEARCHED_FOR + " : ";
                var searchedString = FBUtil.createEL('span', 'searched-string');
                searchedString.innerText = newSearchQuery;

                resultHeading.appendChild(searchedFor);
                resultHeading.appendChild(searchedString);
                resultHeading.appendChild(FBUtil.drawActions(searchActionList, this));
        }


        function _resetSearchResults(newSearchQuery) {
                if (pageCol) {
                        pageCol.reset();
                }
                if (resultHeading) {
                        _resetResultHeading(newSearchQuery);
                }
        }

        function initListView(container) {
                resultHeading = FBUtil.createEL('div', 'result-heading-cont');
                container.appendChild(resultHeading);

                var listCont = FBUtil.createEL('div', 'List-cont');
                container.appendChild(listCont);

                pageCol = new pageCollection({
                        nextData: FBPageSearch.nextPage
                });

                _resultListView = new pageListView(pageCol,listCont);
                _resultListView.render();

                FBPageSearch.setSearchResetCallback(_resetSearchResults);
        }




        function _searchBox(searchBoxCont) {

                var _searchTextbox = FBUtil.createEL('input', 'search-box-input');
                _searchTextbox.setAttribute('id', 'searchBoxInput');
                _searchTextbox.setAttribute('placeholder', SearchConstants.SEARCH_INPUT_MESSAGE);

                var _searchBtn = FBUtil.createEL('div', 'search-box-btn fa fa-search');
                _searchBtn.setAttribute('data-action', 'search');
                _searchBtn.setAttribute('id', 'searchBtn');

                function doSearchQuery(e) {
                        var newSearchQuery = _searchTextbox.value
                        if (_resultListView) {
                                var _searchHeader = document.querySelectorAll('.search-header.init-load');
                                if (_searchHeader[0]) {
                                        _searchHeader[0].classList.remove('init-load');
                                }
                                FBPageSearch.search(newSearchQuery, {
                                        success: pageCol.add.bind(pageCol),
                                        failure: _resultListView.dataFetchError.bind(_resultListView)
                                });
                        }
                }


                function attachEventForSearch() {
                        //attach click on icon
                        _searchBtn.addEventListener('click', doSearchQuery);
                        //attach enterKey on the searchBox Cont
                        _searchTextbox.addEventListener('keyup', function (e) {
                                if (e.keyCode === 13) {
                                        doSearchQuery(e);
                                }
                        });

                }
                attachEventForSearch();
                searchBoxCont.appendChild(_searchTextbox);
                searchBoxCont.appendChild(_searchBtn);

        }


        function initSearchHeader(container) {
                searchHeader = FBUtil.createEL('div', 'search-header init-load');

                var searchTitle = FBUtil.createEL('div', 'search-header-title fa fa-facebook-square');
                searchTitle.innerText = SearchConstants.SEARCH_TITLE;
                var searchBoxCont = FBUtil.createEL('div', 'search-box-cont');

                _searchBox(searchBoxCont);

                searchHeader.appendChild(searchTitle);
                searchHeader.appendChild(searchBoxCont);

                container.appendChild(searchHeader);
        }

        function initSearchLayout(container) {
                initSearchHeader(container);
                initListView(container);
        }

        return {
                init: function (container) {
                        initSearchLayout(container);
                }
        }

})();
