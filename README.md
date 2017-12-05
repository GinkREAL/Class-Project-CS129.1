# Class-Project-CS129.1


#### Downloading this thing
1. Install git

2. git clone https://github.com/GinkREAL/Class-Project-CS129.1.git

3. CD into the created directory

#### Setting up docker

1. Pull the docker mongo image.
```docker pull mongo```

2. Create a bridge network.
```docker network create project```

3. Create a 3-way replicate set
```docker run --name mongo1 -d --network project --hostname mongo1 mongo --replSet project --shardsvr --port 27017
   docker run --name mongo2 -d --network project --hostname mongo2 mongo --replSet project --shardsvr --port 27017
   docker run --name mongo3 -d --network project --hostname mongo3 mongo --replSet project --shardsvr --port 27017```

#### Setting up replication
1. Login to designated primary and setup replication
```docker exec -it mongo1 mongo
   (NOTE: COPY PASTE ONE LINE VERSION AVAILABLE AT BOTTOM IF COPY PASTING THIS DOESN'T WORK)
   var cfg = {
   		"_id" : "project",
   		"version" : 1,
   		"members" : [
   			{
   				"_id" : 0,
   				"host" : "mongo1:27017",
   				"priority" : 1
   			},
   			{
   				"_id" : 1,
   				"host" : "mongo2:27017",
   				"priority" : 0
   			},
   			{
   				"_id" : 2,
   				"host" : "mongo3:27017",
   				"priority" : 0
   			}
   		]
   }
   rs.initiate(cfg)```

2. rs.status() should say OK and command shell should say project:PRIMARY>

3. If it doesn't just keep hitting enter it will eventually say project:PRIMARY>

#### Importing the data and verifying replication
1. Exit mongo and make sure data.csv in same directory then copy to root of mongo1 container
```exit
   docker cp data.csv mongo1:/```

2. Run mongoimport of container on /bin/bash or /bin/ash (whichever works)
```docker exec -it mongo1 /bin/bash
   mongoimport --headerline --type=csv -h mongo1:27017 -d project -c traffic data.csv```

3. Verify import was successful and clean data
```mongo
   use project
   db.traffic.find()
   db.traffic.deleteMany({ time:{$in: ["23:00 - 23:59", "00:00 - 00:59","01:00 - 01:59", "02:00 - 02:59", "03:00 - 03:59", "04:00 - 04:59"]}},{})```

4. Verify replication was successful to node mongo3 (or mongo2)
```exit
   exit
   docker exec -it mongo3 mongo
   rs.slaveOk()
   use project
   db.traffic.find()
   exit```

#### Sharding the data

1. Sharding needs a config server, shards (which may be replicate sets), and a mongos instance.

2. First, the config server
```docker run --name config1 -d --network project --hostname config1 mongo --configsvr --port 27017 --replSet configset```

3. Enable the one-man replicate set of config server
```docker exec -it config1 mongo
   var cfg = {
   		"_id" : "configset",
   		"version" : 1,
   		"members" : [
   		{
   			"_id" : 0,
   			"host" : "config1:27017",
   			"priority" : 1
   		}
   		]
   }
   rs.initiate(cfg)
   rs.status()
   exit```

4. rs.status() should have no errors

5. Now create as many shards as you want. Note that the first replicate set will also be used as a shard
```docker run --name shard1 -d --network project --hostname shard1 mongo --shardsvr --port 27017```

6. Create the mongos instance
```docker run --name mongos -d --network project --hostname mongos --entrypoint /usr/bin/mongos mongo --configdb "configset/config1:27017"```

7. Login to the mongos instance, add shards, set chunksize, create index, then shard the db
```docker exec -it mongos mongo
   sh.addShard("project/mongo1:27017")
   sh.addShard("shard1:27017")
   db.settings.save( { _id:"chunksize", value: 1 } )
   sh.enableSharding("project")
   db.traffic.createIndex({"month": 1})
   sh.shardCollection("project.traffic",{"month":1})
   sh.status()```

8. Verify sharding by logging in manually to shards and checking count against main
```db.traffic.find().count()
   exit
   docker exec -it shard1 mongo
   use project
   db.traffic.find().count()
   exit
   docker exec -it mongo1 mongo
   use project
   db.traffic.find().count()
   exit```

9. Done

#### Copy-Paste Versions

First replicate set config
```var cfg = {"_id" : "project","version" : 1,"members" : [{"_id" : 0,"host" : "mongo1:27017","priority" : 1},{"_id" : 1,"host" : "mongo2:27017","priority" : 0},{"_id" : 2,"host" : "mongo3:27017","priority" : 0}]}```

Second replicate set config
```var cfg = {"_id" : "configset","version" : 1,"members" : [{"_id" : 0,"host" : "config1:27017","priority" : 1}]}```



#### Cleaning up

1. If you wanna delete everything and restart (or not)
```docker stop shard1 config1 mongo1 mongo2 mongo3 mongos
   docker rm shard1 config1 mongo1 mongo2 mongo3 mongos```
























