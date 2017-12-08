map = function(){
	emit(this.month + " " + this.day + ", North Avenue", {"time" : this.time, "entry" : this.north_avenue_entry, "exit" : this.north_avenue_exit});
	emit(this.month + " " + this.day + ", Quezon Avenue", {"time" : this.time, "entry" : this.quezon_avenue_entry, "exit" : this.quezon_avenue_exit});
	emit(this.month + " " + this.day + ", GMA Kamuning", {"time": this.time, "entry" : this.gma_kamuning_entry, "exit" : this.gma_kamuning_exit});
	emit(this.month + " " + this.day + ", Cubao", {"time" : this.time, "entry" : this.cubao_entry, "exit" : this.cubao_exit});
	emit(this.month + " " + this.day + ", Santolan", {"time" : this.time, "entry" : this.santolan_entry, "exit" : this.santolan_exit});
	emit(this.month + " " + this.day + ", Ortigas", {"time" : this.time, "entry" : this.ortigas_entry, "exit" : this.ortigas_exit});
	emit(this.month + " " + this.day + ", Shaw Blvd", {"time" : this.time, "entry" : this.shaw_blvd_entry, "exit" : this.shaw_blvd_exit});
	emit(this.month + " " + this.day + ", Boni Avenue", {"time" : this.time, "entry" : this.boni_avenue_entry, "exit" : this.boni_avenue_exit});
	emit(this.month + " " + this.day + ", Guadalupe", {"time" : this.time, "entry" : this.guadalupe_entry, "exit" : this.guadalupe_exit});
	emit(this.month + " " + this.day + ", Buendia", {"time" : this.time, "entry" : this.buendia_entry, "exit" : this.buendia_exit});
	emit(this.month + " " + this.day + ", Ayala Avenue", {"time" : this.time, "entry" : this.ayala_avenue_entry, "exit" : this.ayala_avenue_exit});
	emit(this.month + " " + this.day + ", Magallanes", {"time" : this.time, "entry" : this.magallanes_entry, "exit" : this.magallanes_exit});
	emit(this.month + " " + this.day + ", Taft", {"time" : this.time, "entry" : this.taft_entry, "exit" : this.taft_exit});
}

map2 = function(){
	emit("Rush Hour Leaderboards", this.value)
}

reduce = function(key, values){
	var j = 0;
	var rt = {};
	values.sort(function(a,b){
		if(a.time < b.time) {return -1;}
		if(a.time > b.time) {return 1;}
		return 0;
	});
	for(var z = 0 ; z < values.length ; z++ ){
		j += values[z].entry;
		j -= values[z].exit;
		rt[values[z].time] = j;
	}
	return rt;
}

reduce2 = function(key, values){
	var j = 0;
	var rt = {};
	for(var z = 0 ; z < values.length ; z++ ){
		rt[values[z].time] = values[z].entry + values[z].exit;
	}
	return rt;
}

reduce3 = function(key, values){
	var rt = {}
	rt["passed"] = true
	for(var z = 0 ; z < values.length ; z++){

		if("passed" in values[z]){

			for(vkey in values[z]){
				if(vkey == "passed") continue;
				if(vkey in rt){
					rt[vkey] += values[z][vkey]
				} else {
					rt[vkey] = values[z][vkey]
				}
			}

		} else {

			var largest = -1
			var largestKey = ""
			for(vkey in values[z]){
				if (values[z][vkey] > largest){
					largest = values[z][vkey]
					largestKey = vkey
				}
			}
			if(largestKey == "") continue; //happens because of the dashes
			if (largestKey in rt){
				rt[largestKey] += 1
			} else {
				rt[largestKey] = 1
			}
		}

	}
	return rt
}

results = db.runCommand({
	mapReduce: 'traffic',
	map: map,
	reduce: reduce,
	out: 'traffic.answer'
})

results2 = db.runCommand({
	mapReduce: 'traffic',
	map: map,
	reduce: reduce2,
	out:'traffic.answer2'
})

results3 = db.runCommand({
	mapReduce: 'traffic.answer2',
	map: map2,
	reduce: reduce3,
	out: 'traffic.summary'
})