var e = React.createElement;

function createXMLChangeListener(r, dispatch) {
    return function() {
        if (r.readyState === XMLHttpRequest.DONE && r.status === 200) {
            dispatch(receiveData(JSON.parse(r.responseText)));
        }
    }
}

function fetchData(link) {
    return function(dispatch) {
        dispatch(requestData());

        var r = new XMLHttpRequest();
        r.onreadystatechange = createXMLChangeListener(r, dispatch);

        r.open('GET', link);
        r.send();
    };
}

function requestData() {
    return {
        type: 'REQUEST_DATA'
    };
}

function receiveData(data) {
    return {
        type: 'RECEIVE_DATA',
        data: data
    };
}

var recordsApp = function(state, action) {
    switch(action.type) {
        case 'INITIAL_LOAD':
            return initialLoad();
        case 'NEXT_PAGE':
            return nextPage(state);
        case 'PREV_PAGE':
            return prevPage(state);
        case 'REQUEST_DATA':
            return {
                loading: true,
                data: null
            };
        case 'RECEIVE_DATA':
            return {
                loading: false,
                data: action.data
            };
    }
};

var store = Redux.createStore(
    recordsApp,
    Redux.applyMiddleware(ReduxThunk.default)
);

function Record(props, context) {
    var instance = Object.create(React.Component.prototype);

    instance.props = props;
    instance.context = context;
    instance.state = {};

    instance.render = function() {
        var artist = this.props.record.artists.map(function(artist) {
            return artist.name;
        }).join(' & ');

        return (
            e('div', null, [
                e('b', null, artist), 
                e('span', {className: 'album-title'}, ' - "' + this.props.record.title + '"'),
                e('a', {href: this.props.record.resource_url}, ' >>')
            ])
        );
    }

    return instance;
}

function Records(props, context) {
    var instance = Object.create(React.Component.prototype);

    instance.props = props;
    instance.context = context;
    instance.state = {};

    instance.componentDidMount = function() {
        this.props.onInitialLoad();
    };

    instance.render = function() {
        var records = 'Loading...',
            prev_link = null,
            next_link = null;

        if (!this.props.loading) {
            var records = this.props.data.releases.map(function(record) {
                return e(Record, {record: record.basic_information});
            });

            if (this.props.data.pagination.urls.prev) {
                prev_link = e('a', {
                    href: 'javascript:void',
                    onClick: this.props.onPrevPageClick.bind(this, this.props.data.pagination.urls.prev + '&sort=artist')
                }, '< Prev');
            }

            if (this.props.data.pagination.urls.next) {
                next_link = e('a', {
                    href: 'javascript:void',
                    onClick: this.props.onNextPageClick.bind(this, this.props.data.pagination.urls.next + '&sort=artist')
                }, 'Next >');
            }
        }

        return e('div', null, [records, prev_link, ' ',next_link]);
    };

    return instance;
}

function mapStateToProps(state) {
    if (!state) {
        return {
            loading: true,
            data: null
        };
    }
    return state;
}

function mapDispatchToProps(dispatch) {
    return {
        onInitialLoad: function() { dispatch(fetchData('https://api.discogs.com/users/80vs90/collection?sort=artist')); },
        onNextPageClick: function(link) { dispatch(fetchData(link)); },
        onPrevPageClick: function(link) { dispatch(fetchData(link)); }
    };
}

var RecordsAppContainer = ReactRedux.connect(
    mapStateToProps,
    mapDispatchToProps
)(Records);

ReactDOM.render(e(ReactRedux.Provider, {store: store}, e(RecordsAppContainer)), document.getElementById('content'));
