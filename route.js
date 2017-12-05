var formidable = require('formidable');
var fs = require('fs');
var jwt     = require('jsonwebtoken');
var passport = require('passport');
var path = require('path');
var request = require('request');
var util = require('util');

var config = require('./config');
var Account = require('./models/account');
var Campus = require('./models/campus');
var Venue = require('./models/venue');
var Floor = require('./models/floor');
var Room = require('./models/room');
var Stall = require('./models/stall');
var Event = require('./models/event');
var Notification = require('./tools/notification');


function checkAuth(req, res, next) {
  var processed = false;
  if (!req.user) {
    processed = true;
    return res.redirect('/login');
  }
  next();
};

module.exports = function (app, io) {
// Define routes.
  app.get('/', checkAuth,
      function (req, res) {

        //for only demo
        return res.redirect('/login');

        /*if (req.user && req.user.role === "superAdmin")
          res.redirect('/dashboard/admin');
        else
          res.render('index', {user: req.user});*/
      });

  app.get('/login',
      function (req, res) {
        res.render('login');
      });

  app.get('/register',
      function (req, res) {
        res.render('register');
      });

  app.post('/login',  function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      req.session.save(function (err) {
        if (err) {
          return next(err);
        }
        // Redirect if it fails
        if (!user) {
          return res.render('login', {title:" Login", page:'/login', info: " Wrong username or password, please try again "});
        }
        req.logIn(user, function(err) {
          if (err) { return next(err); }
          // for only demo
          return res.redirect('/room/Room_2_1M/');

          /*if (req.user && req.user.role === "superAdmin")
            res.redirect('/dashboard/admin');
          else
            res.redirect('/room/Room_2_1M/');*/
        })
      });
    })(req, res, next)
  });

  app.post('/register',
      function (req, res) {
        var user = new Account({
          username : req.body.username,
          email: req.body.email,
          email_verified: false,
          password: req.body.password,
          role: 'admin'
        });
        user.save(function(err, account) {
          if (err) {
            console.log(err);
            var info = err.message;
            return res.redirect('/login#signup');
          }
          req.logIn(user, function(err) {
            req.session.save(function (err1) {
              if (err1) {
                console.log(err1)
                return next(err1);
              }
              return res.redirect('/');
            });
          });
        });
      });

  app.get('/dashboard/admin',
      function (req, res) {
        if (req.user && req.user.role === "superAdmin")
          res.render('campus_list');
        else
          res.redirect('/');
      });

  app.get('/dashboard/campuses',
      function (req, res) {
        if (req.user && req.user.role === "superAdmin")
          res.render('dashboard_campus');
        else
          res.redirect('/');
      });

  app.get('/dashboard/users',
      function (req, res) {
        if (req.user && req.user.role === "superAdmin")
          res.render('dashboard_users');
        else
          res.redirect('/');
      });

  app.get('/dashboard/apiaccess',
      function (req, res) {
        if (req.user && req.user.role === "superAdmin")
          res.render('apiaccess');
        else
          res.redirect('/');
      });

  app.get('/dashboard/apiaccess/:username',
      function (req, res) {
        if (req.user && req.user.role === "superAdmin")
          Venue.find({}, function(err, venues) {
            res.render('apiaccess_user', {username: req.params.username, venues: venues});
          });
        else
          res.redirect('/');
      });

  app.get('/campus/:id/manage', checkAuth,
      function (req, res) {
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');
        //console.log (req.params);
        Campus.findOne({
          "campus_id": { $regex: req.params.id, $options: 'i'}
        }, function(err, campus) {
          if(!campus)
            return res.redirect('/');
          Venue.find({
            "parent_campus": { $regex: req.params.id, $options: 'i'}
          }, function(err, venues) {
            res.render('venue_list', {campus: campus, venues: venues});
          });
        });
      });

  app.get('/campus/:id/', checkAuth,
      function (req, res) {
        //console.log (req.params);
        Campus.findOne({
          "campus_id": { $regex: req.params.id, $options: 'i'}
        }, function(err, campus) {
          if(!campus)
            return res.redirect('/');
          Venue.find({
            "parent_campus": { $regex: req.params.id, $options: 'i'}
          }, function(err, venues) {
            res.render('campus_view', {campus: campus, venues: venues});
          });
        });
      });

  app.get('/campus/:id/edit', checkAuth,
      function (req, res) {
        //console.log (req.params);
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');

        Campus.findOne({
          "campus_id": { $regex: req.params.id, $options: 'i'}
        }, function(err, campus) {
          if(!campus)
            return res.redirect('/');
          Venue.find({
            "parent_campus": { $regex: req.params.id, $options: 'i'}
          }, function(err, venues) {
            var new_no = 0;
            venues.forEach(function(item){
              if (new_no < item.id)
                new_no = item.id
            })
            res.render('edit_campus', {campus: campus, venues: venues, new_no: new_no});
          });
        });
      });

  app.get('/add_campus', checkAuth,
      function (req, res) {
        res.render('add_campus', {});
      });

  app.post('/get_campuses', checkAuth,
      function (req, res) {
        Campus.find({}, function(err, ents) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          return res.json(ents);
        });
      });
  app.post('/get_venues/:id', checkAuth,
      function (req, res) {
        Venue.find({"parent_campus": { $regex: req.params.id, $options: 'i'}}, function(err, ents) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          return res.json(ents);
        });
      });

  app.get('/get_user/:id', checkAuth,
      function (req, res) {
        Account.findOne({"_id": req.params.id}, function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          return res.json(ent);
        });
      });

  app.post('/get_user_by_name/:username', checkAuth,
      function (req, res) {
        Account.findOne({"username": req.params.username}, function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          return res.json(ent);
        });
      });

  app.post('/get_users', checkAuth,
      function (req, res) {
        if (req.user.role != "superAdmin")
          return res.json({err:"hasNoPermission"});

        Account.find({}, function(err, ents) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          return res.json(ents);
        });
      });

  app.post('/add_venue', checkAuth,
      function (req, res) {
        console.log (req.body);
        var venue = new Venue({
          venue_id : req.body.venueid,
          name : req.body.name,
          created : new Date(),
          description: req.body.description
        });

        venue.save(function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          } else {
            Venue.find({}, function(err, ents) {
              if (err) {
                console.log(err);
                return res.json(err);
              }
              return res.json(ents);
            });
          }
        });
      });

  app.post('/api/add_campus', checkAuth,
      function (req, res) {
        var campus_info = req.body.campus;
        var oldfile = campus_info.map_file;
        campus_info.created = new Date();
        campus_info.map_file = campus_info.map_file.replace(/\/roommap\/tmp/, '/roommap/use');
        var campus = new Campus(campus_info);

        campus.save(function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          } else {
            fs.renameSync(__dirname + '/public' + oldfile, __dirname + '/public' + campus_info.map_file);
            var venues = req.body.venues;
            var callback_ct = venues.length;
            venues.forEach(function(item){
              var venue = new Venue(item);
              venue.created = new Date();
              venue.save(function(err, ret) {
                if (err) {
                  console.log (err);
                  res.json(err);
                }
                else if (callback_ct != 1)
                  callback_ct --;
                else
                  res.json({msg:"successfully added!"})
              });
            });
          }
        });
      });

  app.post('/api/update_campus', checkAuth,
      function (req, res) {
        var campus_info = req.body.campus;
        var oldfile = campus_info.map_file;
        var oldcampusid = campus_info.old_campus_id;
        var oldvenueid;
        delete campus_info.old_campus_id;
        campus_info.updated = new Date();
        campus_info.map_file = campus_info.map_file.replace(/\/roommap\/tmp/, '/roommap/use');
        //var campus = new Campus(campus_info);

        Campus.findOneAndUpdate({campus_id: oldcampusid}, {$set:campus_info},function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          } else {
            fs.renameSync(__dirname + '/public' + oldfile, __dirname + '/public' + campus_info.map_file);
            var venues = req.body.venues;
            var callback_ct = venues.length;
            venues.forEach(function(item){
              //var venue = new Venue(item);
              oldvenueid = item.old_venue_id;
              item.updated = new Date();
              delete item.old_venue_id;
              Venue.findOneAndUpdate({venue_id: oldvenueid}, {$set:item},function(err, ent) {
                if (err) {
                  console.log (err);
                  res.json(err);
                }
                else if (callback_ct != 1)
                  callback_ct --;
                else
                  res.json({msg:"successfully updated!"})
              });
            });
          }
        });
      });

  app.post('/add_user', checkAuth,
      function (req, res) {
        var user = new Account({
          username : req.body.username,
          email : req.body.email,
          password : req.body.password,
          role : req.body.role,
          permission : req.body.permission,
          created : new Date()
        });

        user.save(function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          } else {
            Account.find({}, function(err, ents) {
              if (err) {
                console.log(err);
                return res.json(err);
              }
              return res.json(ents);
            });
          }
        });
      });

  app.post('/api/tmpmap_upload',
      function (req, res) {
          var form = new formidable.IncomingForm();
          var file_name, fileurl;
          form.parse(req);
          form.on('fileBegin', function (name, file){
            //console.log ("formidable file begin ")
          });

          form.on('field', function(name, field){
          });
          form.on('file', function (name, file){
            if (file.name) {
              console.log (file.name);
              fileurl = '/roommap/tmp/'+ (new Date).getTime()+file.name;
              file_name = __dirname + '/public' + fileurl;
              fs.rename(file.path, file_name);
            }
          });

          form.on('end', function() {
            res.json({filename:fileurl});
          })
      }
  );

  app.get('/api/get_events',
      function (req, res) {
        Account.findOne({"username": req.query.username, "password": req.query.password}, function(err, ent) {
          if (!err && ent) {
            Venue.findOne({
              "venue_id": { $regex: req.query.venueid, $options: 'i'}
            }, function(err, venue) {
              if (!venue || !ent.apiaccess || ent.apiaccess.split(',').indexOf(venue.name) < 0) {
                return res.json({msg: 'this api access is forbidden!'});
              }
              Floor.find({parent_venue: req.query.venueid}).exec(function (err2, floors) {
                if (!err2 && floors.length > 0) {
                  var floorids = [];
                  floors.forEach(function (floor) {
                    floorids.push(floor.floor_id);
                  })
                  Room.find({parent_floor: {'$in': floorids}}).exec(function (err3, rooms) {
                    if (!err3 && rooms.length > 0) {
                      var roomids = [];
                      rooms.forEach(function (room) {
                        roomids.push(room.room_id);
                        roomids.push(room.name);
                      })
                      Stall.find({parent_room: {'$in': roomids}}).exec(function (err4, stalls) {
                        if (!err4 && stalls.length > 0) {
                          var stallids = [];
                          stalls.forEach(function (stall) {
                            stallids.push(stall.sensor_id);
                          })
                          Event.find({sensor_id: {'$in': stallids}}).sort({timestamp: 1}).exec(function (err, ents) {
                            return res.json(ents);
                          });
                        }
                      });
                    }
                  });
                }
              });
            });
          }
        });
      });

  app.post('/api/reg_event',
      function (req, res) {
        console.log (req.body);

        if (!req.body.sensor_id)
          return res.json({msg: 'failed'});
        var evt = new Event({
          sensor_id : req.body.sensor_id,
          timestamp: new Date(),
          event: req.body.event
        });
        evt.save(function(err, event) {
          if (err) {
            console.log(err);
            return res.json(err);
          }

          var status;
          if (req.body.event)
            status = 'busy';
          else
            status = 'vacant';
          Stall.findOneAndUpdate({sensor_id: req.body.sensor_id}, {$set:{status:status}}, function(err, ent) {
            if (err) {
              console.log(err);
              return res.json(err);
            }
            io.emit('registerd_new_event', event);
            if(ent)
              ent.status = status;
            io.emit('stall_updated', ent);
            return res.json(event);
          });
        });
      });

  app.post('/api/stall',
      function (req, res) {
        console.log (req.body);

        Stall.findOneAndUpdate({sensor_id: req.body.sensor_id}, {$set:req.body}, {upsert:true,new:true}, function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
         // console.log(ent);
         // return res.json(ent);

          var date = new Date();
          var oldtime=ent.modified_time;
          var use_time = Math.round(Math.abs(date.getTime() - oldtime.getTime())/1000);
          if(ent.status != "vacant"){  //when status triggers to  "busy"...
            ent.number_of_changes++;
            if(ent.busy_time!=null && ent.busy_time!=undefined)ent.busy_time+=use_time;
            else ent.busy_time=use_time;
            if(ent.used_week==0)ent.used_week=ent.used_today;
            if(ent.used_month==0)ent.used_month=ent.used_week;
            ent.used_today++;
            ent.used_week++;
            ent.used_month++;
          }else{
            ent.vacant_time+=use_time;         
          }      
          ent.modified_time = date;    

          var total = (ent.number_of_changes==0)?1:ent.number_of_changes;
          if(ent.long_use<Math.round(use_time/60) && ent.status=="vacant") ent.long_use = Math.round(use_time/60);
          //var current_time = date.getFullYear()+"-"+(date.etMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
          ent.avg_vacant_time = Math.round(ent.vacant_time / total);
          ent.avg_busy_time = Math.round(ent.busy_time / total);
          ent.save();

          //For floor update
          io.emit('stall_updated', ent); //For room update

          //Getting the venue id           
          Stall.aggregate([{$match:{sensor_id:ent.sensor_id}},{$lookup:{from:"rooms", localField:"parent_room",foreignField:"name", as:"rooms"} },{$project:{rooms:{parent_floor:1}}},{$unwind:"$rooms"},{$lookup:{from:"floors", localField:"rooms.parent_floor", foreignField:"floor_id",as:"floors"}}, {$unwind:"$floors"},{$project:{floors:{parent_venue:1}}} ],function(err,result){
              if(err){
                return res.json(err);
              }            
            var venue = result[0].floors.parent_venue;
            console.log("parent venue", venue);
            //Getting the floor information
            Floor.aggregate([{$project:{name:1, floor_id:1, parent_venue:1}},{$match:{parent_venue:venue}},{$lookup:{from:"rooms",localField:"floor_id",foreignField:"parent_floor",as:"rooms"}},{$unwind:"$rooms"},{$project:{_id:0,name:1, floor_id:1, parent_venue:1, rooms:{name:1, room_type:1}}},{$lookup:{from:"stalls",localField:"rooms.name",foreignField:"parent_room",as:"stalls"}},{$unwind:"$stalls"},{$group:{_id:"$stalls.parent_room",floor:{$first:"$floor_id"},used_today:{$sum:"$stalls.used_today"},used_week:{$sum:"$stalls.used_week"},used_month:{$sum:"$stalls.used_month"},avg_vacant_time:{$avg:"$stalls.avg_vacant_time"},avg_busy_time:{$avg:"$stalls.avg_busy_time"},long_use:{$max:"$stalls.long_use"}}}],function(err,result){
              if(err){
                return res.json(err);
              }
              io.emit("floor_updated", result);
            });

            //Update room info ...
            //Getting the available counts;;;
            Stall.aggregate([{$match:{parent_room:ent.parent_room,status:"vacant"}},{$group:{_id:null, count:{$sum:1}}}], function(err, avail_count){

              var count = avail_count.count;
            //  console.log("room_avail_notification", count);
              Notification.sendnotification("room_avail_notification", count, io);
            });
            Stall.aggregate([{$match:{parent_room:ent.parent_room}},{$group:{_id:null, totaltime:{$sum:"$avg_busy_time"}}}], function(err, usedtime){
              var totaltime = usedtime.totaltime;
             // console.log("room_availtime_notification", totaltime);
              Notification.sendnotification("room_availtime_notification", totaltime, io);
            });            


          });



          return res.json(ent);
        });
      });

  app.post('/api/room',
      function (req, res) {
        console.log (req.body);

        Room.findOneAndUpdate({room_id: req.body.room_id}, {$set:req.body}, {upsert:true}, function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          io.emit('room_updated', ent);
          return res.json(ent);
        });
      });

  app.post('/api/floor',
      function (req, res) {
        console.log (req.body);

        Floor.findOneAndUpdate({name: req.body.name}, {$set:req.body}, {upsert:true}, function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          io.emit('floor_updated', ent);
          return res.json(ent);
        });
      });

  app.get('/forgotpassword',
      function (req, res) {
//        res.render('resetpassword');
      });

  app.get('/logout',
      function (req, res) {
        req.logout();
        res.redirect('/');
      });

  app.get('/test_api',
      function (req, res) {
        return res.json({a:1, b:2});
      });

  app.get('/floor/:id/', checkAuth,
      function (req, res) {
        //console.log (req.params);
        Floor.findOne({
          "floor_id": { $regex: req.params.id, $options: 'i'}
        }, function(err, floor) {
          if(!floor)
            return res.redirect('/floor_map/STA01');
          Room.find({
            "parent_floor": { $regex: req.params.id, $options: 'i'}
          }, function(err, rooms) {
            for (i = 0; i < rooms.length; i++) {
              rooms[i].status_col = 'rgb(' + (510 * (rooms[i].total_stalls - rooms[i].available_stalls) / rooms[i].total_stalls).toFixed(0) +
                  ',' + (510 * rooms[i].available_stalls / rooms[i].total_stalls).toFixed(0) + ',0 )';
            }
          Floor.aggregate([{$project:{name:1, floor_id:1, parent_venue:1}},{$match:{parent_venue:floor.parent_venue}},{$lookup:{from:"rooms",localField:"floor_id",foreignField:"parent_floor",as:"rooms"}},{$unwind:"$rooms"},{$project:{_id:0,name:1, floor_id:1, parent_venue:1, rooms:{name:1, room_type:1}}},{$lookup:{from:"stalls",localField:"rooms.name",foreignField:"parent_room",as:"stalls"}},{$unwind:"$stalls"},{$group:{_id:"$stalls.parent_room",floor:{$first:"$floor_id"},used_today:{$sum:"$stalls.used_today"},used_week:{$sum:"$stalls.used_week"},used_month:{$sum:"$stalls.used_month"},avg_vacant_time:{$avg:"$stalls.avg_vacant_time"},avg_busy_time:{$avg:"$stalls.avg_busy_time"},long_use:{$max:"$stalls.long_use"}}}],function(err,allrooms){
            if(err){
              return res.json(err);
            }
            res.render('floor_map1', {floor: floor, rooms: rooms, venueid: floor.parent_venue, allrooms:allrooms});
          });             
           // res.render('floor_list', {floor: floor, rooms: rooms, venueid: floor.parent_venue});
          });
        });
      });

  app.get('/add_room/:id', checkAuth,
      function (req, res) {
        //console.log (req.params);
        Floor.findOne({
          "floor_id": { $regex: req.params.id, $options: 'i'}
        }, function(err, floor) {
          if(!floor)
            return res.redirect('/');
            res.render('add_room', {floor: floor});
        });
      });

  app.post('/get_rooms/:id', checkAuth,
      function (req, res) {
        Room.find({"parent_floor": { $regex: req.params.id, $options: 'i'}}, function(err, ents) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          return res.json(ents);
        });
      });

  app.get('/add_floor/:id', checkAuth,
      function (req, res) {
        Venue.findOne({
          "venue_id": { $regex: req.params.id, $options: 'i'}
        }, function(err, venue) {
          if(!venue)
            return res.redirect('/');
          res.render('add_floor', {venue: venue});
        });
      });

  app.post('/api/add_room', checkAuth,
      function (req, res) {
        var room_info = req.body.room;
        var oldfile = room_info.map_file;
        room_info.created = new Date();
        room_info.map_file = room_info.map_file.replace(/\/roommap\/tmp/, '/roommap/use');
        var room = new Room(room_info);

        room.save(function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          } else {
            fs.renameSync(__dirname + '/public' + oldfile, __dirname + '/public' + room_info.map_file);
            console.log (oldfile);
            console.log (room_info.map_file);
            var stalls = req.body.stalls;
            var callback_ct = stalls.length;
            stalls.forEach(function(item){
              var stall = new Stall(item);
              stall.save(function(err, ret) {
                if (err) {
                  console.log (err);
                  res.json(err);
                }
                else if (callback_ct != 1)
                  callback_ct --;
                else
                  res.json({msg:"successfully added!"})
              });
            });
          }
        });
      });

  app.post('/get_floors/:id', checkAuth,
      function (req, res) {
        Floor.find({"parent_venue": { $regex: req.params.id, $options: 'i'}}, function(err, ents) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          return res.json(ents);
        });
      });

  app.post('/add_floor/:id', checkAuth,
      function (req, res) {
        var floor = new Floor({
          parent_venue : req.params.id,
          floor_id : req.body.floor_id,
          name : req.body.name,
          total_stalls : req.body.totalstct,
          created : new Date(),
          description: req.body.description,
          available_stalls: req.body.available_stalls,
          available_percent: req.body.available_percent,
          avg_vacant_time: req.body.avg_vacant_time,
          vacant_time_percent: req.body.vacant_time_percent,
          needs_attention: req.body.needs_attention,
          available_fromlastweek: req.body.available_fromlastweek,
          available_now: req.body.available_now
        });

        floor.save(function(err, ent) {
          if (err) {
            console.log(err);
            return res.json(err);
          } else {
            Venue.find({}, function(err, ents) {
              if (err) {
                console.log(err);
                return res.json(err);
              }
              return res.json(ents);
            });
          }
        });
      });

  app.post('/delete_floor/:id', checkAuth,
      function (req, res) {
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');
        Floor.findOneAndRemove({ floor_id: req.params.id })
            .exec(function(err, ent) {
              if (err) {
                console.log(err);
                return res.json(err);
              } else {
                Floor.find({parent_venue: req.body.venueid}, function(err, ents) {
                  if (err) {
                    console.log(err);
                    return res.json(err);
                  }
                  return res.json(ents);
                });
              }
            });
      });

  app.post('/delete_venue', checkAuth,
      function (req, res) {
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');
        Venue.findOneAndRemove({ venue_id: req.body.venueid })
            .exec(function(err, ent) {
              if (err) {
                console.log(err);
                return res.json(err);
              } else {
                Venue.find({}, function(err, ents) {
                  if (err) {
                    console.log(err);
                    return res.json(err);
                  }
                  return res.json(ents);
                });
              }
            });
      });

  app.post('/delete_campus', checkAuth,
      function (req, res) {
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');

        Campus.findOneAndRemove({ campus_id: req.body.campusid })
            .exec(function(err, ent) {
              console.log (ent);
              if (err) {
                console.log(err);
                return res.json(err);
              } else {
                Campus.find({}, function(err, ents) {
                  if (err) {
                    console.log(err);
                    return res.json(err);
                  }
                  return res.json(ents);
                });
              }
            });
      });

  app.post('/delete_user', checkAuth,
      function (req, res) {
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');
        
        Account.findOneAndRemove({ _id: req.body.id})
            .exec(function(err, ent) {
              if (err) {
                console.log(err);
                return res.json(err);
              } else {
                return res.json({msg:'success'});
              }
            });
      });

  app.get('/floor_map/:id', checkAuth,
     function (req, res) {
     //console.log (req.params);
     Floor.findOne({
     "floor_id": { $regex: req.params.id, $options: 'i'}
     }, function(err, floor) {
         if(!floor)
         return res.redirect('/floor_map/STA01');
   
         Room.find({
         "parent_floor": { $regex: req.params.id, $options: 'i'}
         }, function(err, rooms) {
           for(i=0; i<rooms.length; i++) {
           rooms[i].status_col = 'rgb('+(510*(rooms[i].total_stalls - rooms[i].available_stalls)/rooms[i].total_stalls).toFixed(0)+
           ','+(510*rooms[i].available_stalls/rooms[i].total_stalls).toFixed(0)+',0 )';
           }
          Floor.aggregate([{$project:{name:1, floor_id:1, parent_venue:1}},{$match:{parent_venue:floor.parent_venue}},{$lookup:{from:"rooms",localField:"floor_id",foreignField:"parent_floor",as:"rooms"}},{$unwind:"$rooms"},{$project:{_id:0,name:1, floor_id:1, parent_venue:1, rooms:{name:1, room_type:1}}},{$lookup:{from:"stalls",localField:"rooms.name",foreignField:"parent_room",as:"stalls"}},{$unwind:"$stalls"},{$group:{_id:"$stalls.parent_room",floor:{$first:"$floor_id"},used_today:{$sum:"$stalls.used_today"},used_week:{$sum:"$stalls.used_week"},used_month:{$sum:"$stalls.used_month"},avg_vacant_time:{$avg:"$stalls.avg_vacant_time"},avg_busy_time:{$avg:"$stalls.avg_busy_time"},long_use:{$max:"$stalls.long_use"}}}],function(err,allrooms){
            if(err){
              return res.json(err);
            }
            res.render('floor_map1', {floor: floor, rooms: rooms, venueid: floor.parent_venue, allrooms:allrooms});
          });               
           //res.render('floor_map1', {floor: floor, rooms: rooms, venueid: floor.parent_venue});
         });
       });
     });

  app.post('/get_venues', checkAuth,
      function (req, res) {
        Venue.find({}, function(err, ents) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          return res.json(ents);
        });
      });

  app.post('/get_campuses', checkAuth,
      function (req, res) {
        Campus.find({}, function(err, ents) {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          return res.json(ents);
        });
      });

  app.get('/venue/:id/', checkAuth,
      function (req, res) {
        //console.log (req.params);
        Venue.findOne({
          "venue_id": { $regex: req.params.id, $options: 'i'}
        }, function(err, venue) {
          if(!venue)
            return res.redirect('/');
          Floor.find({
            "parent_venue": { $regex: req.params.id, $options: 'i'}
          }, function(err1, floors) {
            if (err1)
              return res.redirect('/');
            Room.find({}, function(err2, rooms) {
              if (err2)
                return res.redirect('/');
              var i,j;
              for (i = 0; i < floors.length; i++) {
                floors[i].rooms = [];
                for (j = 0; j < rooms.length; j++) {
                  if (rooms[j].parent_floor == floors[i].floor_id)
                    floors[i].rooms.push(rooms[j]);
                }
              }
              res.render('venue_view', {venue: venue, floors: floors});
            });
          });
        });
      });

  app.get('/venue/:id/edit', checkAuth,
      function (req, res) {
        //console.log (req.params);
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');
        Venue.findOne({
          "venue_id": { $regex: req.params.id, $options: 'i'}
        }, function(err, venue) {
          if(!venue)
            return res.redirect('/');
          res.render('venue_edit', {venue: venue});
        });
      });

  app.get('/venue/:id/setting', checkAuth,
      function (req, res) {
        //console.log (req.params);
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');
        Venue.findOne({
          "venue_id": { $regex: req.params.id, $options: 'i'}
        }, function(err, venue) {
          console.log (JSON.stringify(venue.notify_option));
          if(!venue)
            return res.redirect('/');
          res.render('venue_setting', {venue: venue, notify_option: JSON.stringify(venue.notify_option)});
        });
      });

  app.post('/venue/:id/edit', checkAuth,
      function (req, res) {
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');
        //console.log (req.params);
        var venue_info = req.body;
        console.log (venue_info);
        Venue.update({"venue_id": { $regex: req.params.id, $options: 'i'}}, {"$set":venue_info}, function(err, venue) {
          if(!venue)
            return res.redirect('/');
          console.log (venue);
          res.redirect('/dashboard/admin');
        });
      });

  app.post('/api/venue/setting', checkAuth,
      function (req, res) {
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');
        var venue_setting = req.body.setting;
        Venue.update({"venue_id": { $regex: req.body.venue_id, $options: 'i'}}, {"$set":venue_setting}, function(err, venue) {
          if(!venue)
            return res.json({ret: 'failed'});
          console.log (venue);
          return res.json({ret: 'success'});
        });
      });

  app.post('/api/user_access/:username', checkAuth,
      function (req, res) {
        if (req.user.role != 'admin' && req.user.role != 'superAdmin')
          return res.redirect('/');
        console.log (req.body);
        var apiaccess = req.body.apiaccess;
        Account.update({"username": { $regex: req.params.username, $options: 'i'}}, {"$set":{apiaccess: apiaccess}}, function(err, user) {
          if(!user)
            return res.json({ret: 'failed'});
          console.log (user);
          return res.json({ret: 'success'});
        });
      });

  app.get('/room/:id/', checkAuth,
      function (req, res) {
        //console.log (req.params);
        Room.findOne({
          "room_id": { $regex: req.params.id, $options: 'i'}
        }, function(err1, room) {
          if(!room)
            return res.redirect('/room/Room_2_1M/');
          Stall.find({
            "parent_room": { $regex: req.params.id, $options: 'i'}
          }, function(err2, stalls) {
            //console.log (room);

            for(var i=0; i<stalls.length; i++) {
              stalls[i].index= i+1;
              if(stalls[i].status=="vacant")
                stalls[i].isActive = true;
              else
                stalls[i].isActive = false;
            }
            Floor.findOne({
              "floor_id": { $regex: room.parent_floor, $options: 'i'}
            }, function(err3, floor) {

              if (!floor)
                return res.json({err: "floor is not exist"});
              console.log (floor);

              if (room.room_type == "room1") {
                res.render('dashboard', {room: room, stalls: stalls, venueid: floor.parent_venue});
              } else if (room.room_type == "stadium1") {
                res.render('dashboard_stadium1', {room: room, stalls: stalls, venueid: floor.parent_venue});
              } else {
                res.render('room_view', {room: room, stalls: stalls, venueid: floor.parent_venue});
              }
            }); 
          });
        });
      });

  app.get('/video/1.mp4', function (req, res) {
      res.render('video_play');
  });
};