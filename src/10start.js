
/**
 UMD envelope 
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.alasql = factory();
    }
}(this, function () {

/**
 alasql - Main Alasql class
 @param {string | Object} sql SQL-statement or data object for fuent interface
 @param {Object} params SQL parameters
 @param {Function} cb callback function
 @param {Object} scope Scope for nested queries
 @return {array} Result data object
 
 Standard sync call:
    alasql('CREATE TABLE one');
 Query:
 	var res = alasql('SELECT * FROM one');
 Call with parameters:
 	var res = alasql('SELECT * FROM ?',[data]);
 Standard async call with callback function:
 	alasql('SELECT * FROM ?',[data],function(res){
		console.log(data);
 	});
 Call with scope for subquery (to pass common values):
    var scope = {one:{a:2,b;20}}
    alasql('SELECT * FROM ? two WHERE two.a = one.a',[data],null,scope);
 Call for fluent interface with data object:
    alasql(data).Where(function(x){return x.a == 10}).exec();
 Call for fluent interface without data object:
    alasql().From(data).Where(function(x){return x.a == 10}).exec();
 */

var alasql = function(sql, params, cb, scope) {
	if(typeof importScripts != 'function' && alasql.webworker) {
		var id = alasql.lastid++;
		alasql.buffer[id] = cb;
		alasql.webworker.postMessage({id:id,sql:sql,params:params});
	} else {
		if(arguments.length == 0) {
			// Without arguments - Fluent interface
			return new yy.Select({
				columns:[new yy.Column({columnid:'*'})],
				from: [new yy.ParamValue({param:0})]
			});
		} else if (arguments.length == 1 && typeof sql == "object" && sql instanceof Array) {
			// One argument data object - fluent interface
				var select = new yy.Select({
					columns:[new yy.Column({columnid:'*'})],
					from: [new yy.ParamValue({param:0})]
				});
				select.preparams = [sql];	
				return select;
		} else {
			// Standard interface
			// alasql('#sql');
			if(typeof sql == 'string' && sql[0]=='#' && typeof document == "object") {
				sql = document.querySelector(sql).textContent;
			} else if(typeof sql == 'object' && sql instanceof HTMElement) {
				sql = sql.textContent;
			} else if(typeof sql == 'function') {
				// to run multiline functions
				sql = sql.toString().slice(14,-3);
			}
			// Run SQL			
			return alasql.exec(sql, params, cb, scope);
		}
	};
};

/** Current version of alasql */
alasql.version = "0.1.6";
alasql.debug = undefined; // Initial debug variable

getAlaSQLPath();

function getAlaSQLPath() {
	alasql.path = '';

	if (typeof importScripts === 'function') {
		alasql.path = '';		
		// TODO Check how to get path in worker
	} else if(typeof exports != 'undefined') { 
		alasql.path = __dirname;
		// 
		//console.log(require('alasql').resolve());
	} else if(typeof Meteor == 'object' && Meteor.isClient) {
			alasql.path = '/packages/dist/';
	} else if(typeof Meteor == 'object' && Meteor.isServer) {
			alasql.path = 'assets/packages/dist/';
	} else if(typeof document != 'undefined') {
		var sc = document.getElementsByTagName('script');
		for(var i=0;i<sc.length;i++) {
			if (sc[i].src.substr(-16).toLowerCase() == 'alasql-worker.js') {
				alasql.path = sc[i].src.substr(0,sc[i].src.length-16); 
				break;
			} else if (sc[i].src.substr(-20).toLowerCase() == 'alasql-worker.min.js') {
				alasql.path = sc[i].src.substr(0,sc[i].src.length-20);
				break;
			} else if (sc[i].src.substr(-9).toLowerCase() == 'alasql.js') {
				alasql.path = sc[i].src.substr(0,sc[i].src.length-9); 
				break;
			} else if (sc[i].src.substr(-13).toLowerCase() == 'alasql.min.js') {
				alasql.path = sc[i].src.substr(0,sc[i].src.length-13); 
				break;
			};
		};	
	};
};

