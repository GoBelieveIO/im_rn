import { appendFile } from "react-native-fs";

const API_URL = "http://api.gobelieve.io";

var api = {
    token:"",

    uploadAudio:function(filePath) {
        var url = API_URL + "/v2/audios";
        var formData = new FormData();
        console.log("uri:", filePath);

        var s = filePath.split("/");
        if (s.length == 0) {
            return;
        }

        var fileName = s[s.length-1];
        formData.append('file', {uri: "file://" + filePath, name:fileName, type:"audio/amr-nb"});
        let options = {};
        options.body = formData;
        options.method = 'post';
        options.headers = {
            "Authorization":"Bearer " + this.token,
            'Content-Type': 'multipart/form-data',
        };
        return fetch(url, options)
            .then((response) => {
                return Promise.all([response.status, response.json()]);
            })
            .then((values)=>{
                var status = values[0];
                var respJson = values[1];
                if (status != 200) {
                    console.log("upload image fail:", respJson);
                    return Promise.reject(respJson);
                }
                console.log("upload image success:", respJson);
                return respJson.src_url;
            });
    },

    uploadImage: function(uri, fileName) {
        var url = API_URL + "/v2/images";
        var formData = new FormData();
        formData.append('file', {uri: uri, name:fileName, type:"image/jpeg"});
        let options = {};
        options.body = formData;
        options.method = 'POST';
        options.headers = {
            'Content-Type': 'multipart/form-data; boundary=6ff46e0b6b5148d984f148b6542e5a5d',
            "Authorization":"Bearer " + this.token,
        };
        return fetch(url, options)
            .then((response) => {
                return Promise.all([response.status, response.json()]);
            })
            .then((values)=>{
                var status = values[0];
                var respJson = values[1];
                if (status != 200) {
                    console.log("upload image fail:", respJson);
                    Promise.reject(respJson);
                    return;
                }
                console.log("upload image success:", respJson);
                return respJson.src_url;
            });
    }

};

export default api;