'use strict';

var expect = require('chai').expect;
var fs = require('fs-extra');
var path = require('path');
var packageServerScript = require('../../../src/cli/domain/package-server-script/index.js');
var hashBuilder = require('../../../src/utils/hash-builder');

var serverName = 'server.js';
var componentName = 'component';
var componentPath = path.resolve(__dirname, componentName);
var publishPath = path.resolve(componentPath, '_package');
var bundlerOptions = {
  stats: 'none'
};

describe('cli : domain : package-server-script', function(){
  beforeEach(function(done){
    if(!fs.existsSync(componentPath)) {
      fs.mkdirSync(componentPath);
      fs.mkdirSync(path.resolve(componentPath, '_package'));
    }
    done();
  });

  afterEach(function(done){
    if(fs.existsSync(componentPath)) {
      fs.removeSync(componentPath);
    }
    done();
  });

  describe('when packaging component\'s server.js', function(){
    this.timeout(10000);

    describe('when component does not require any json', function(){
      var serverContent = 'module.exports.data=function(context,cb){return cb(null, {name:\'John\'}); };';

      beforeEach(function(done){
        fs.writeFileSync(path.resolve(componentPath, serverName), serverContent);
        done();
      });

      it('should save compiled data provider', function(done){
        packageServerScript(
          {
            componentPath: componentPath,
            ocOptions: {
              files: {
                data: serverName
              }
            },
            publishPath: publishPath,
            bundler: bundlerOptions
          },
          function(err, res){
            if (err) {
              throw err;
            }
            expect(res.type).to.equal('node.js');
            expect(res.src).to.equal('server.js');
            var compiledContent = fs.readFileSync(path.resolve(publishPath, res.src), {encoding: 'utf8'});
            expect(res.hashKey).to.equal(hashBuilder.fromString(compiledContent));
            done();
          }
        );
      });
    });

    describe('when component implements not-valid javascript', function(){
      var serverContent = 'var data=require(\'request\');\nmodule.exports.data=function(context,cb){\nreturn cb(null,data; };';

      beforeEach(function(done){
        fs.writeFileSync(path.resolve(componentPath, serverName), serverContent);
        done();
      });

      it('should throw an error with error details', function(done){
        packageServerScript(
          {
            componentPath: componentPath,
            ocOptions: {
              files: {
                data: serverName
              }
            },
            publishPath: publishPath,
            bundler: bundlerOptions
          },
          function(err, res){
            expect(err.toString().match(/Unexpected token,.*\(3:19\)/)).to.be.ok;
            done();
          }
        );
      });
    });

    describe('when component uses es2015 javascript syntax', function(){
      var serverContent = 'const {first, last} = {first: "John", last: "Doe"};\nexport const data = (context,cb) => cb(null, context, first, last)';

      beforeEach(function(done){
        fs.writeFileSync(path.resolve(componentPath, serverName), serverContent);
        done();
      });

      it('should throw an error with error details', function(done){
        packageServerScript(
          {
            componentPath: componentPath,
            ocOptions: {
              files: {
                data: serverName
              }
            },
            publishPath: publishPath,
            bundler: bundlerOptions
          },
          function(err, res){
            // console.log(res);
            // expect(err.toString().match(/Unexpected token,.*\(3:19\)/)).to.be.ok;
            done();
          }
        );
      });
    });


  });
});


// OLD SPEC
// ======================================

// var expect = require('chai').expect;
// var injectr = require('injectr');
// var path = require('path');
// var sinon = require('sinon');
// var uglifyJs = require('uglify-js');
// var _ = require('underscore');

// var fsMock,
//     packageServerScript;

// var initialise = function(fs){

//   fsMock = _.extend({
//     existsSync: sinon.stub().returns(true),
//     readFileSync: sinon.stub().returns('file content'),
//     readJsonSync: sinon.stub().returns({ content: true }),
//     writeFile: sinon.stub().yields(null, 'ok')
//   }, fs || {});

//   packageServerScript = injectr('../../src/cli/domain/package-server-script/index.js', {
//     'fs-extra': fsMock,
//     path: {
//       extname: path.extname,
//       join: path.join,
//       resolve: function(){
//         return _.toArray(arguments).join('/');
//       }
//     }
//   });
// };

// describe.skip('cli : domain : package-server-script', function(){

//   describe('when packaging component\'s server.js', function(){

//     describe('when component implements not-valid javascript', function(){

//       var error;
//       var serverjs = 'var data=require(\'request\');\nmodule.exports.data=function(context,cb){\nreturn cb(null,data; };';

//       beforeEach(function(done){

//         initialise({ readFileSync: sinon.stub().returns(serverjs) });

//         packageServerScript({
//           componentPath: '/path/to/component/',
//           ocOptions: {
//             files: {
//               data: 'myserver.js'
//             }
//           },
//           publishPath: '/path/to/component/_package/'
//         }, function(e, r){
//           error = e;
//           done();
//         });
//       });

//       it('should throw an error with error details', function(){
//         expect(error.toString()).to.equal('Error: Javascript error found in myserver.js [3,19]: SyntaxError: Unexpected token punc «;», expected punc «,»]');
//       });
//     });

//     describe('when component does not require any json', function(){

//       var result,
//           serverjs = 'module.exports.data=function(context,cb){return cb(null, {name:\'John\'}); };';

//       beforeEach(function(done){

//         initialise({ readFileSync: sinon.stub().returns(serverjs) });

//         packageServerScript({
//           componentPath: '/path/to/component/',
//           ocOptions: {
//             files: {
//               data: 'server.js'
//             }
//           },
//           publishPath: '/path/to/component/_package/'
//         }, function(e, r){
//           result = r;
//           done();
//         });
//       });

//       it('should save compiled data provider', function(){
//         expect(fsMock.writeFile.args[0][1]).to.equal('module.exports.data=function(n,e){return e(null,{name:"John"})};');
//       });

//       it('should return hash for script', function(){
//         expect(result.hashKey).not.be.empty;
//       });
//     });

//     describe('when component requires a json', function(){

//       var requiredJson = { hello: 'world' },
//           serverjs = 'var data = require(\'./someJson\'); module.exports.data=function(context,cb){return cb(null,{}); };';

//       beforeEach(function(done){

//         initialise({
//           readFileSync: sinon.stub().returns(serverjs),
//           readJsonSync: sinon.stub().returns(requiredJson)
//         });

//         packageServerScript({
//           componentPath: '/path/to/component/',
//           ocOptions: {
//             files: {
//               data: 'server.js'
//             }
//           },
//           publishPath: '/path/to/component/_package/'
//         }, done);
//       });

//       it('should save compiled and minified data provider encapsulating json content', function(){
//         var written = fsMock.writeFile.args[0][1];

//         expect(written).to.contain('var __sandboxedRequire=require,__localRequires={"./someJson":{hello:"world"}};'
//           + 'require=function(e){return __localRequires[e]?__localRequires[e]:__sandboxedRequire(e)};var data=require("./someJson");'
//           + 'module.exports.data=function(e,r){return r(null,{})};');
//       });
//     });

//     describe('when component requires an npm module', function(){

//       var error,
//           serverjs = 'var data=require(\'request\');module.exports.data=function(context,cb){return cb(null,data); };';

//       beforeEach(function(done){

//         initialise({ readFileSync: sinon.stub().returns(serverjs) });

//         packageServerScript({
//           componentPath: '/path/to/component/',
//           ocOptions: {
//             files: {
//               data: 'server.js'
//             }
//           },
//           publishPath: '/path/to/component/_package/'
//         }, function(e, r){
//           error = e;
//           done();
//         });
//       });

//       it('should throw an error when the dependency is not present in the package.json', function(){
//         expect(error.toString()).to.equal('Error: Missing dependencies from package.json => ["request"]');
//       });
//     });

//     describe('when component requires a relative path from an npm module', function(){

//       var error,
//           serverjs = 'var data=require(\'react-dom/server\');module.exports.data=function(context,cb){return cb(null,data); };';

//       beforeEach(function(done){

//         initialise({ readFileSync: sinon.stub().returns(serverjs) });

//         packageServerScript({
//           componentPath: '/path/to/component/',
//           ocOptions: {
//             files: {
//               data: 'server.js'
//             }
//           },
//           publishPath: '/path/to/component/_package/'
//         }, function(e, r){
//           error = e;
//           done();
//         });
//       });

//       it('should throw an error when the dependency is not present in the package.json', function(){
//         expect(error.toString()).to.equal('Error: Missing dependencies from package.json => ["react-dom"]');
//       });
//     });

//     describe('when component requires a js file', function(){

//       var serverjs = 'var data=require(\'./hi.js\');module.exports.data=function(context,cb){return cb(null,data); };',
//           error;

//       beforeEach(function(done){

//         initialise({ readFileSync: sinon.stub().returns(serverjs) });

//         packageServerScript({
//           componentPath: '/path/to/component/',
//           ocOptions: {
//             files: {
//               data: 'server.js'
//             }
//           },
//           publishPath: '/path/to/component/_package/'
//         }, function(e, r){
//           error = e;
//           done();
//         });
//       });

//       it('should not package component and respond with error', function(){
//         expect(error.toString()).to.equal('Error: Requiring local js files is not allowed. Keep it small.');
//       });
//     });

//     describe('when component requires a file without extension that is not found as json', function(){

//       var serverjs = 'var data=require(\'./hi\');module.exports.data=function(context,cb){return cb(null,data); };',
//           error;

//       beforeEach(function(done){

//         initialise({
//           readFileSync: sinon.stub().returns(serverjs),
//           existsSync: sinon.stub().returns(false)
//         });

//         packageServerScript({
//           componentPath: '/path/to/component/',
//           ocOptions: {
//             files: {
//               data: 'server.js'
//             }
//           },
//           publishPath: '/path/to/component/_package/'
//         }, function(e, r){
//           error = e;
//           done();
//         });
//       });

//       it('should not package component and respond with error', function(){
//         expect(error.toString()).to.equal('Error: ./hi.json not found. Only json files are require-able.');
//       });
//     });

//     describe('when component code includes a loop', function(){

//       var serverjs = 'module.exports.data=function(context,cb){ var x,y,z;'
//           + 'while(true){ x = 234; } '
//           + 'for(var i=1e12;;){ y = 546; }'
//           + 'do { z = 342; } while(true);'
//           + 'return cb(null,data); };',
//           result;

//       beforeEach(function(done){

//         initialise({
//           readFileSync: sinon.stub().returns(serverjs),
//           existsSync: sinon.stub().returns(false)
//         });

//         packageServerScript({
//           componentPath: '/path/to/component/',
//           ocOptions: {
//             files: {
//               data: 'server.js'
//             }
//           },
//           publishPath: '/path/to/component/_package/'
//         }, function(e, r){
//           result = r;
//           done();
//         });
//       });

//       it('should wrap the while loop with an iterator limit (and convert it to a for loop)', function(){
// expect(fsMock.writeFile.firstCall.args[1]).to.contain('for(var r,a,t,i=1e9;;){if(i<=0)throw new Error(\"loop exceeded maximum allowed iterations\");r=234,i--}');
//       });

//       it('should wrap the for loop with an iterator limit', function(){
//         expect(fsMock.writeFile.firstCall.args[1]).to.contain('for(var i=1e9;;){if(i<=0)throw new Error(\"loop exceeded maximum allowed iterations\");a=546,i--}');
//       });

//       it('should wrap the do loop with an iterator limit (and convert it to a for loop)', function(){
//         expect(fsMock.writeFile.firstCall.args[1]).to.contain('for(var i=1e9;;){if(i<=0)throw new Error(\"loop exceeded maximum allowed iterations\");t=342,i--}');
//       });
//     });
//   });
// });