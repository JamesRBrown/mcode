#!/usr/bin/env node
'use strict';
(function(){
    
    const hbjs = require('handbrake-js');
    const ansi = require('ansi-escape-sequences');
    const fs = require('fs');
    const p = require("path");
    const EventEmitter = require('events');
    
    const commandLineArgs = require('command-line-args');
    const optionDefinitions = [
        {name: 'verbose', alias: 'v', type: Boolean, defaultValue: false},
        {name: 'force', alias: 'f', type: Boolean, defaultValue: false},
        {name: 'recursive', alias: 'r', type: Boolean, defaultValue: false},
        {name: 'delete', alias: 'd', type: Boolean, defaultValue: false},
        {name: 'commit', alias: 'c', type: Boolean, defaultValue: false},
        {name: 'extensions', alias: 'e', type: String, defaultValue: 'avi,mpg'},
        {name: 'help', alias: 'h', type: Boolean, defaultValue: false},        
        {name: 'path', alias: 'p', type: String}
    ];
    const options = commandLineArgs(optionDefinitions, { partial: true });
    
    const commandLineUsage = require('command-line-usage');
    
    const sections = [
        {
            header: 'Mp4 Encoder',
            content: 'A utility to transcode video files into mp4.'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'commit',
                    //typeLabel: '{underline file}',
                    description: 'Commit changes.'
                },
                {
                    name: 'delete',
                    //typeLabel: '{underline file}',
                    description: 'Delete original file.'
                },
                {
                    name: 'force',
                    //typeLabel: '{underline file}',
                    description: 'Over writings existing files. '
                },
                {
                    name: 'recursive',
                    //typeLabel: '{underline file}',
                    description: 'Recursively process subdirectories.'
                },
                {
                    name: 'extensions',
                    //typeLabel: '{underline file}',
                    description: 'Comma delimited source extensions.'
                },
                {
                    name: 'path',
                    typeLabel: '{underline directory}',
                    description: 'The directory to process.'
                },
                {
                    name: 'help',
                    description: 'Print this usage guide.'
                }
            ]
        },
        {
            header: 'Aliases',
            optionList: [
                {
                    name: 'c',
                    //typeLabel: '{underline file}',
                    description: '--commit'
                },
                {
                    name: 'd',
                    //typeLabel: '{underline file}',
                    description: '--delete'
                },
                {
                    name: 'f',
                    //typeLabel: '{underline file}',
                    description: '--force'
                },
                {
                    name: 'r',
                    //typeLabel: '{underline file}',
                    description: '--recursive'
                },
                {
                    name: 'e',
                    //typeLabel: '{underline file}',
                    description: '--extensions'
                },
                {
                    name: 'p',
                    typeLabel: '',
                    description: '--path'
                },
                {
                    name: 'h',
                    description: '--help'
                }
            ]
        }
    ];
    const usage = commandLineUsage(sections);
    
    
    var log = require('../libs/logging.js');
    log.config({ 
        console: true,          //turn on/off console logging
        //path: true,           //prepend file path
        //file: true,             //prepend filename
        line: false,             //prepend line number
        //func: true,             //prepend function name
        app: "trans"    //set app name, used for email function
    });//*/ 
    
    
    var transcode = function(src, dst, callback){
        callback = callback || function(){};
        
        function column (n, msg) {
            process.stdout.write(ansi.cursor.horizontalAbsolute(n) + msg);
        }

        function onProgress (progress) {
            column(1, progress.task + '  ');
            column(11, progress.percentComplete.toFixed(2) + '   ');
            column(22, progress.fps.toFixed(2) + '   ');
            column(32, progress.avgFps.toFixed(2) + '   ');
            column(42, progress.eta);
        }
        log.log(`\nTranscoding...`);
        log.log(`src: ${src}`);
        log.log(`dst: ${dst}`);
        
        var dstExist = fs.existsSync(dst);
        if(dstExist && options.force){
            console.log('\x1b[31m%s\x1b[0m', `dst exists: ${dst}`);
        }else if(dstExist){
            console.log(`dst exists: ${dst}`);
        }
        //*
        if(options.commit){
            if(!dstExist || options.force){
                //*
                hbjs.spawn({ preset: 'Normal', input: src, output: dst })
                    .on('begin', function () {
                        console.log(ansi.format('Task      % done     FPS       Avg FPS   ETA', 'bold'));
                        this.began = true;
                    })
                    .on('error', err => {
                      // invalid user input, no video found etc
                    })
                    .on('progress', onProgress).on('complete', function () {
                        if (!this.began) console.error(this.output);
                        console.log();
                    })
                    .on('complete', function () {
                        log.log(`finished transcoding: ${dst}`);
                        callback(true);
                    });//*/
            }else{
                console.log(`...skipping.`);
                callback();
            }
        }else{
            callback();
        }
        
        
    };
       
    function getFiles(path, files){
        path = path || '.';
        files = files || [];
        try{
            var items = fs.readdirSync(path);
            if(items){
                items.forEach(function(item){
                    if(item && fs.existsSync(`${path}/${item}`)){
                        var ap = p.resolve(`${path}/${item}`);
                            var pd = p.resolve(path);
                            (function(ap, path, item){
                                try{
                                    var stats = fs.statSync(ap);
                                    if(stats && stats.isDirectory()){
                                        //console.log(ap+"/");
                                        if(options.recursive){
                                            files = getFiles(ap, files);
                                        }
                                    }else if(stats){
                                        //mapFunction(ap);
                                        files.push({
                                            file: ap,
                                            filename: item,
                                            name: item.match(/(.+)\.[^.]+$/)[1],
                                            extension: item.match(/\.([^.]+)$/)[1],
                                            path: path,
                                            dev: stats.dev,
                                            mode: stats.mode,
                                            nlink: stats.nlink,
                                            uid: stats.uid,
                                            gid: stats.gid,
                                            rdev: stats.rdev,
                                            blksize: stats.blksize,
                                            inodeID: stats.ino,
                                            size: stats.size,
                                            blocks: stats.blocks,
                                            atimeMs: stats.atimeMs,
                                            mtimeMs: stats.mtimeMs,
                                            ctimeMs: stats.ctimeMs,
                                            birthtimeMs: stats.birthtimeMs,
                                            atime: stats.atime,
                                            mtime: stats.mtime,
                                            ctime: stats.ctime,
                                            birthtime: stats.birthtime
                                        });
                                    }
                                }
                                catch(err){

                                }
                            })(ap, pd, item);
                    }
                });   
            }
        }catch (err){
            //console.log(err);
        }
        return files;
    }
    
    var checkExtension = function(ext){
        var es = options.extensions.replace(/\s/g,'').match(/[^,]+/g);
        var match = false;
        for(var i = 0, l = es.length; i < l; i++){
            match = es[i].toUpperCase() === ext.toUpperCase();
            if(match) break;
        }

        return match;
    };
    
    var processFiles = function(files){ 
        //log.log(files);
        var file = files.shift();
        //log.log(file);
        if(file){
            if(checkExtension(file.extension)){
                var src = file.file;
                var dst = `${file.path}/${file.name}.mp4`;
                transcode(src, dst, function(transcoded){
                    if(fs.existsSync(dst) && transcoded){ 
                        deleteFile(src); 
                    }                
                    processFiles(files);
                });
            }else {
                processFiles(files);
            }
        }
        
    };
    
    var deleteFile = function(file){        
        if(options.delete){
            console.log('\x1b[31m%s\x1b[0m', `Delete: ${file}`);
            if(options.commit){
                fs.unlinkSync(file);
            }            
        }
    };
    
    var getPath = function(){
        if(options._unknown){
            if(options._unknown.length===1){
                if(!options.path){
                    return options._unknown[0];
                }else{
                    return options.path;
                }
            }
        }
        throw "Error: Path required!";
    };
    
    //*
    if(options.help){
        console.log(usage);
    }else{
        try{
            processFiles(getFiles(getPath()));
        }catch(err){
            console.error(err);
            console.log(usage);
        }        
    }//*/
    
    //console.log(options);
    //console.log(getPath());
    
    //processFiles(getFiles(path));
    //console.log(getFiles(path));
})();