
var subscriptionHandler = function () {
        this.event = {};
}

subscriptionHandler.prototype = {
        on: function (_eventName, _callback) {
                if (typeof _eventName === 'string' && typeof _callback === 'function') {
                        if (this.event[_eventName]) {
                                this.event[_eventName].push(_callback);
                        } else {
                                this.event[_eventName] = [_callback];
                        }
                }
        },
        publish: function (_eventName, data) {
                if (this.event[_eventName]) {
                        this.event[_eventName].forEach(function (_callback) {
                                _callback(data);
                        });
                }
        }
}




var pageModel = (function () {
        "use strict";
        var _defaults = {
                picture: {
                        data: {
                                url: "default.jpg"
                        }
                },
                fav: false,
                actions: [{
                        op: 'open',
                        icon: 'external-link',
                        action: function () {
                                this.open();
                        }
                }, {
                        op: 'remove',
                        icon: 'trash',
                        action: function () {
                                this.model.delete();
                        }
                }, {
                        op: 'mark_fav',
                        icon: 'star',
                        action: function (e) {
                                this.model.toggleFav();
                        }
                }],
                footerAction : [{
                                    op: 'expand',
                                    icon: 'angle-double-down',
                                    action: function (e) {
                                            if(e.target.classList.contains('fa-angle-double-down')===true){
                                                e.target.classList.remove('fa-angle-double-down');
                                                e.target.classList.add('fa-angle-double-up');
                                            }else{
                                                e.target.classList.add('fa-angle-double-down');
                                                e.target.classList.remove('fa-angle-double-up');
                                            }
                                            this.model.expand();
                                    }
                                }]
        }


        var _pageModel = function (tileData) {
                if (typeof tileData === 'object') {
                        FBUtil.merge(tileData, _defaults);
                        FBUtil.merge(this, tileData);
                }
                subscriptionHandler.call(this);
        };

        _pageModel.prototype = Object.create(subscriptionHandler.prototype);

        _pageModel.prototype.toggleFav = function () {
                this.fav = !this.fav;
                this.publish('fav');
        };

        _pageModel.prototype.delete = function () {
                this.publish('delete',this);
        };

        _pageModel.prototype.expand = function () {
                // If need more details from server do something like
                // var expandDetailURL = baseURL+'/pageid?moreDetails';
                // FBUtil.ajaxGet(expandDetailURL,updateModelCallback);
                 this.publish('expand');
        };

        return _pageModel;
})();



var pageTileView = (function () {
        "use strict";

        function _drawContentcover(tileModel) {
                var _coverHTML = "";
                if (tileModel.cover) {
                        _coverHTML += "<div class='tile-cover'>\
                                    <img src='" + tileModel.cover.source + "' class='rImg'>\
                           </div>";
                }
                return _coverHTML;
        }

        function _drawRowAbout(tileModel) {
                var _aboutHTML = "";
                if (tileModel.about) {
                        _aboutHTML += "<div class='tile-about'>\
                                <div class='about-content'>" + tileModel.about + "</div>\
                           </div>";
                }
                return _aboutHTML;
        }

        function _tileContent(tileModel) {

                return "<div class='tile-header'>\
                                <div class='tile-picture'>\
                                    <img src='" + tileModel.picture.data.url + "' class='rImg'>\
                                </div>\
                                <div class='tile-title'>\
                                    <div class='basic basic-1'>" + tileModel.name + "</div>\
                                    <div class='basic basic-2'>" + tileModel.category + "</div>\
                                </div>\
                                <div class='tile-actions'>\
                                </div>\
                           </div>\
                             " + _drawRowAbout(tileModel) + "\
                           <div class='tile-content'>\
                                " + _drawContentcover(tileModel) + "\
                                <div class='tile-description'>\
                                    <pre>" + (tileModel.description ? tileModel.description : "") + "</pre>\
                                </div>\
                           </div>\
                           <div class='tile-footer'>\
                                <div class='tile-footer-actions'>\
                                </div>\
                           </div>";

        }

        function favSelIndicator() {
                var fav_Star = this.tileEL.querySelectorAll('.action[data-action="mark_fav"]');
                if (this.model.fav === true) {
                        fav_Star[0].classList.add('fav-selected');
                } else {
                        fav_Star[0].classList.remove('fav-selected');
                }
        }

        function tileTemplate(tileModel) {
                var _tile = FBUtil.createEL("div", "tile-item");
                _tile.setAttribute('id', tileModel.id);
                _tile.innerHTML = _tileContent(tileModel);

                var actionHolder = _tile.getElementsByClassName('tile-actions');
                actionHolder[0].appendChild(FBUtil.drawActions(tileModel.actions, this));

                var actionHolder = _tile.getElementsByClassName('tile-footer-actions');
                actionHolder[0].appendChild(FBUtil.drawActions(tileModel.footerAction, this));

                return _tile;
        }

        var pageTileView = function (_model) {
                this.model = _model;
                // this.model.favDisplayCallback = this.displayFavIndicator.bind(this);
                this.model.on('fav', this.displayFavIndicator.bind(this));
                this.model.on('expand', this.expandDetails.bind(this));
                 this.model.on('delete', this['delete'].bind(this));
        };

        pageTileView.prototype = {
                render: function () {
                        this.tileEL = tileTemplate.call(this, this.model);
                        this.displayFavIndicator();
                        return this.tileEL;
                },
                expandDetails: function () {                    
                    var cont = this.tileEL.getElementsByClassName('tile-content');
                        cont[0].classList.toggle('expanded');
                },
                displayFavIndicator: function () {
                        favSelIndicator.call(this);
                },
                open: function () {
                        if (this.model.link)
                                window.open(this.model.link);
                },
                delete: function () {
                        this.tileEL.remove();
                }
        }
        return pageTileView;


})();



var pageCollection = (function () {
        "use strict";
        var pageCollection = function (_params) {

                this.nextData = _params.nextData;
                this._models = [];
                this._modelIds = [];

                subscriptionHandler.call(this);
        };

        pageCollection.prototype = Object.create(subscriptionHandler.prototype);

        pageCollection.prototype.add = function (dataList) {
                var that = this;
                if (dataList && Array.isArray(dataList) && dataList.length > 0) {
                        var _modelList = [];
                        var _modelIdList = [];
                        dataList.forEach(function (_itemData) {
                                var _model = new pageModel(_itemData);
                                    _model.on('delete',that.removeModel.bind(that));
                                    _modelList.push(_model);
                                    _modelIdList.push(_model.id);
                        });
                        FBUtil.merge(this._models, _modelList);
                        FBUtil.merge(this._modelIds, _modelIdList);
                        this.publish('add', _modelList);
                }
        };

        pageCollection.prototype.reset = function () {
                this._models = [];
                this._modelIds = [];
                this.publish('reset');
        };

         pageCollection.prototype.removeModel = function (_modelToRemove) {
                var _index = this._modelIds.indexOf(_modelToRemove.id);
                if(_index!=-1){
                    this._modelIds.splice(_index,1);
                    this._models.splice(_index,1);
                }
        };

        pageCollection.prototype.next = function () {
                this.nextData({
                        success: this.add.bind(this),
                        failure: function (err) {
                                this.publish('serverError', err)
                        }
                });
        };
        return pageCollection;
})();



var pageListView = (function () {
        "use strict";
        var _pageSize = 5,
                errNotifier = null,
                noContentDisplayCont = null;

        function _drawNotifier(container) {
                errNotifier = FBUtil.createEL('div', 'err-notifier');
                container.appendChild(errNotifier);
        }

        function displayError(errorText) {
                errNotifier.innerText = errorText;
                errNotifier.classList.add('expanded');
                setTimeout(function () {
                        errNotifier.classList.remove('expanded');
                }, 3000);
        }

        function _drawNoContentToDisplay() {
                noContentDisplayCont = FBUtil.createEL("div", 'list-no-content');
                noContentDisplayCont.innerText = SearchConstants.NO_CONTENT;
                return noContentDisplayCont;
        }

        function displayNoContentMsg(enable) {
                if (noContentDisplayCont) {
                        var isVisible = noContentDisplayCont.classList.contains('visible');
                        if (enable === true && isVisible === false) {
                                noContentDisplayCont.classList.add('visible');
                        } else if (enable === false && isVisible === true) {
                                noContentDisplayCont.classList.remove('visible');
                        }
                }
        }

        function attachInfiniteScroll() {
                var that = this;
                that.container.addEventListener('scroll', function (e) {
                        //scrollTop Check and call drawnext of That
                        var _scrollTop = that.container.scrollTop;
                        var _contHeight = that.container.clientHeight;
                        if (that.blockNextLoad !== true) {
                                if ((_scrollTop + _contHeight) > (that.listItemContainer.clientHeight - (2 * _contHeight))) {
                                        that.drawNextData();
                                }

                                if (that._curRenderedIndex >= that.collection._models.length - _pageSize) {
                                        that.fetchNextData();
                                }
                        }
                });
        }

        function renderListItemContainer() {
                var listItemContainer = FBUtil.createEL('div', 'list-item-cont visible');
                attachInfiniteScroll.call(this);
                this.container.appendChild(listItemContainer);
                return listItemContainer;
        }

        var pageListView = function (_collection,_container) {
                this.collection = _collection;
                 this.container = _container;

                this._curRenderedIndex = 0;
                this.needMoreData = false;

                this.collection.on('add', this.initRenderTiles.bind(this));
                this.collection.on('reset', this.resetView.bind(this));
                this.collection.on('serverError', this.dataFetchError.bind(this));
        };

        pageListView.prototype = {
                render: function (_params) {                                               
                        this.container.innerHTML = "";
                        this.container.scrollTop = 0;
                        this.listItemContainer = renderListItemContainer.call(this);
                        this.resetView();
                        _drawNotifier(this.container);                        
                },
                initRenderTiles: function (_modelList) {
                        if (this._curRenderedIndex === 0 || this.needMoreData === true) {
                                displayNoContentMsg(false);
                                this.renderTiles(_modelList);
                                this._curRenderedIndex += _modelList.length;
                        }
                },
                redraw: function () {
                        this.render();
                        this.renderTiles(this.collection._models);
                        this.blockNextLoad = false;
                },
                renderTiles: function (modelList) {
                        var that = this;
                        if (that._curRenderedIndex === 0 && modelList.length > 0) {
                                displayNoContentMsg(false);
                        }
                        modelList.forEach(function (_pageModel) {
                                that.listItemContainer.appendChild((new pageTileView(_pageModel)).render());
                        });
                },
                resetView: function () {
                        this.listItemContainer.innerHTML = "";
                        this.listItemContainer.appendChild(_drawNoContentToDisplay());
                        displayNoContentMsg(true);
                        this.needMoreData = false;
                        this._curRenderedIndex = 0;
                        this.blockNextLoad = false;
                },
                renderFav: function () {
                        this.render();
                        var favModelList = this.collection._models.filter(function (_model) {
                                return _model.fav === true;
                        });

                        this.blockNextLoad = true;
                        if (favModelList.length > 0) {
                                displayNoContentMsg(false);
                                this.renderTiles(favModelList);
                        }
                },
                dataFetchError: function (err) {
                        var errText = err;
                        if (typeof err === 'string' && err.startsWith("CUSTOM:")) {
                                //use custom error code or Text Right now hardcoding the errorText
                                errText = SearchConstants.NO_SEARCH_CRITERIA; //err.substr("CUSTOM:".length);
                        } else if (typeof err === 'object' && err.error) {
                                errText = err.error.message;
                        }
                        displayError(errText);
                },
                fetchNextData: function () {
                        this.collection.next();
                },
                drawNextData: function () {
                        if (this.collection._models.length > this._curRenderedIndex) {
                                var nextPageData = this.collection._models.slice(this._curRenderedIndex, this._curRenderedIndex + _pageSize);
                                this.renderTiles(nextPageData);
                                this._curRenderedIndex += nextPageData.length;
                        } else {
                                this.needMoreData = true;
                        }
                }
        }
        return pageListView;
})();
