/* TODO 
            - use id to get tempo, duration, genres
            - put id into spotify to get similar songs
            - sort those songs by tempo/bpm
            - make up a function of time of the ideal change in tempo
            - when each song is done, reference the function (pass in current time) and get
                        back the ideal bpm for the current time
            - play next song that fits in the range of ideal bpm
        */
        
        var apikey = "JFWCRLMETTMP5IJCA";
        var clientID = "40f5df559dbd45f09cff9f08a29a0ec6";
        var id;
        var duration;
        var restingHeartRate;
        var targetHeartRate;
        var genres = [];
        var songsList = []; // list of all similar songs, sorted
        var finalList = []; // list of songs in playlist in order
        var error = 3; // + or - range from ideal bpm
        
        function getSongs() {
            songsList = [];
            var seedName = $("#seedname").val();
            var seedArtist = $("#seedartist").val();
            duration = $("#duration").val();
            var url = "http://developer.echonest.com/api/v4/song/search?api_key=" +
                apikey + "&artist=" + encodeURI(seedArtist) + "&title=" + encodeURI(seedName);
            var bucketUrl;
            var spotifyID;
            $.ajax({
                url: url,
                success: function(data, status) {
                    id = data.response.songs[0].id;
                    console.log(id);
                    bucketUrl = "http://developer.echonest.com/api/v4/song/profile?api_key=" + apikey 
                        + "&id=" + id + "&bucket=audio_summary";
                    callBucket(bucketUrl, seedArtist);
                }
            });    
            // spotifyID = getSpotifyID(id, seedName, seedArtist, apikey);
            // return spotifyID;
        }
        
        function callBucket(bucketUrl, seedArtist) {
            $.ajax({
                url: bucketUrl,
                success: function(data, status) {
                    var styleUrl = "http://developer.echonest.com/api/v4/artist/terms?api_key=" + apikey 
                        + "&name=" + encodeURI(seedArtist) + "&format=json";
                    getGenre(styleUrl);
                }
            });
        }
        
        function getGenre(styleUrl) {
             $.ajax({
                url: styleUrl,
                success: function(data, status) {
                    for (var i = 0; i < data.response.terms.length; i++) {
                        genres.push(data.response.terms[i].name);
                    }
                    similarSongs();
                }
            });  
        }   
            
        function similarSongs() {
            restingHeartRate = $("#restingHeartRate").val();
            targetHeartRate = restingHeartRate * .8;
            // var numSongs = Math.ceil($("#duration").val() / 2.5);
            var numSongs = Math.ceil($("#duration").val() * 5); // todo fix algorithm problem
            var radiourl = "http://developer.echonest.com/api/v4/playlist/static?api_key=" +
                apikey + "&song_id=" + id + "&min_tempo=" + targetHeartRate + "&max_tempo=" 
                + restingHeartRate + "&format=json&results=" + Math.min(numSongs, 100) +
                "&type=song-radio&bucket=audio_summary&sort=tempo-desc" 
            // sort increasing or decreasing depending on activity
            $.ajax({
                url: radiourl,
                success: function(data, status) {
                    var temp = data.response.songs;
                    for (var i = 0; i < Math.min(numSongs, 100) ; i++) {
                        songsList.push({
                            "artist_name"   :   temp[i].artist_name,
                            "title"         :   temp[i].title,
                            "tempo"         :   temp[i].audio_summary.tempo,
                            "duration"      :   temp[i].audio_summary.duration
                        });
                        console.log("title: " + songsList[i].title + "\n");
                        console.log("tempo: " + songsList[i].tempo + "\n\n");
                    }
                    sort();
                }
            });
        }
       
        function sort() {
            var pivot = songsList[Math.floor((right + left) / 2)].tempo;
            var lo = 0;
            var hi = songsList.length;

            while (lo <= hi) {
                while (songsList[lo].tempo < pivot) {
                    lo++;
                }
                while (songsList[hi].tempo > pivot) {
                    hi--;
                }
                if (lo <= hi) {
                    swap(songsList, lo, hi);
                    lo++;
                    hi--;
                }
            }
            filterList();
        }
       
        function swap(items, firstIndex, secondIndex) {
            var temp = items[firstIndex];
            items[firstIndex] = items[secondIndex];
            items[secondIndex] = temp;
        }
       
        function filterList() {
            var counter = 0;
            for (var i = 0; i < songsList.length; i++) {
                if (Math.floor(counter / 60) < duration) { 
                    if (Math.abs(songsList[i].tempo - idealBPM(counter, songsList[i].tempo)) < error) {
                        finalList.push(songsList[i]);
                        counter += songsList[i].duration;
                    }
                }
            }
        }
       
        function idealBPM(time, songLength) {
            var bpm = ((targetHeartRate - restingHeartRate) / songLength) * time + restingHeartRate;
            return bpm;
        }
   
        function getSpotifyID(name, artist, apikey) {
            var spotifyUrl = "http://developer.echonest.com/api/v4/song/search?api_key=" +
                apikey + "&format=json&results=1&artist=" + encodeURI(artist) + "&title=" + 
                encodeURI(name) + "&bucket=id:spotify&bucket=tracks&limit=true";
            var spotifyID = 0;
            $.ajax({
                url: spotifyUrl,
                success: function(data, status) {
                    spotifyID = data.response.songs[0].artist_foreign_ids[0].foreign_id;
                    playSong(spotifyID);
                }
            });
        }
       
    // JFWCRLMETTMP5IJCA 
