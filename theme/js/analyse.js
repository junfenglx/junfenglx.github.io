/*
 * custome analyse js
 * author: junfeng
 */
var ly = (function ($){
    $.cookie.defaults.path = "/";
    var hostname = "http://glance.algo.org.cn";
    hostname = "http://127.0.0.1:9000";
    var ly = {};
    var timedelta = 0;
    var isBlur = false;
    var start = new Date();
    var hidden, visibilityChange;
    var real_id = $.cookie("user_id");
    var temp_user_id = $.cookie("temp_user");
    var browse_session_id = $.cookie("browse_session");
    var page_count = $.cookie("page_count", Number);
    var last_record = $.cookie("last_record");

    function handleVisibilityChange(e) {
        console.log(hidden + ": " + document[hidden]);
        var end = new Date();
        if (document[hidden]) {
            isBlur = false;
            timedelta += (end.getTime() - start.getTime());
            console.log("timedelta: " + timedelta);
        }
        else {
            isBlur = true;
            start =  end;
        }
    }
    function initVisibility(){
        //using visibilitychange event check whether user is on the page.
        if (typeof document.addEventListener === "undefined" ||
            typeof hidden === "undefined") {
            console.log("browser doesn't support for page visibility api.")
        } else {
            document.addEventListener(visibilityChange, handleVisibilityChange, false);
        }
    }

    function handleVisibilityChange_1(e) {
        var end = new Date();
        var eventType = e.type;
        if (eventType == "blur") {
            isBlur = true;
            timedelta += (end.getTime() - start.getTime());
            //console.log("leave page")
            //console.log("timedelta: " + timedelta);
        }
        if (eventType == "focus"){
            //console.log("come back page")
            isBlur = false;
            start =  end;
        }
    }
    function initVisibility_1() {
        //using blur focus events check whether user is on the page.
        $(window).blur(handleVisibilityChange_1);
        $(window).focus(handleVisibilityChange_1);
    }
    function mypost(url, data, callback, async){
        var post_data = [];
        $.each(data, function(key, value){
            post_data.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
        })
        post_data = post_data.join("&");
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, async);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4){
                if (xhr.status != 200){
                    return;
                }
                ret= JSON.parse(xhr.responseText);
                callback(ret);
            }
        }
        xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
        xhr.send(post_data);
    }
    function getTempUser(){
        mypost(hostname + "/" + "newtempuser", {}, function (ret){
            temp_user_id = ret["temp_user"];
            $.cookie("temp_user", temp_user_id, {expires: 365*10});
            console.log("temp_user: " + temp_user_id);
            getSession();
        }, true);
    }

    function inc_page_count(){
        page_count = $.cookie("page_count", Number);
        $.removeCookie("page_count");
        if (typeof page_count === "undefined" || page_count < 0)
            page_count = 0;
        page_count += 1;
        $.cookie("page_count", page_count);
    }

    function des_page_count() {
        page_count = $.cookie("page_count", Number);
        $.removeCookie("page_count");
        if (typeof page_count === "undefined" || page_count < 0)
            page_count = 0;
        else
            page_count -= 1;
        $.cookie("page_count", page_count);
    }

    function getSession(){
        mypost(hostname + "/newsession", {"temp_user": temp_user_id},
                function (ret){
                    if (ret["status"] == "ok"){
                        browse_session_id = ret["browse_session"];
                        $.cookie("browse_session", browse_session_id);
                        console.log("browse_session: " + browse_session_id);

                        page_count = 1;
                        $.cookie("page_count", page_count);

                        console.log("add beforeunload listener.");
                        window.onbeforeunload = onbeforeunload;
                    }
                }, true);
    }
    function postRealId(){
        mypost(hostname + "/setrealid", {"real_id": real_id, "temp_user": temp_user_id}, function(ret){
            if (ret["status"] == "ok"){
                $.cookie("setedrealid", true, {expires: 365*10});
            }
        }, true);
    }
    function onbeforeunload(e){
        onunload(null);
        //return "want to leave?";
    }
    function onunload(e){
        if (!isBlur){
            var end = new Date();
            timedelta += (end.getTime() - start.getTime());
        }
        console.log("timedelta: " + timedelta);
        var url = document.URL;
        mypost(hostname + "/recordpage",
               {"temp_user": temp_user_id,
               "browse_session": browse_session_id,
               "url": url,
               "timedelta": timedelta
               }, function (ret){
                   if (ret["status"] == "ok"){
                       console.log(url);
                   }
               },
              false);
        //set last_record time
        last_record = new Date();
        $.cookie("last_record", last_record.getTime());
        des_page_count();
    }

    ly.init = function (){

        if (!temp_user_id){
            getTempUser();
        }
        else{
            var now = new Date();
            if (!browse_session_id || !last_record || (!page_count && now.getTime() - last_record > 10000)){
                console.log("request browse_session_id...");
                getSession();
            }
            else{
                //add page_count
                inc_page_count();
            }
        }
        console.log("page_count: " + page_count);


        if ( temp_user_id && real_id && !$.cookie("setedrealid")){
            postRealId();
        }
        if (temp_user_id && browse_session_id){
            console.log("add beforeunload listener.");
            //document.addEventListener("beforeunload", onbeforeunload, false);
            //document.addEventListener("unload", onunload, false);
            //window.onunload = onunload;
            window.onbeforeunload = onbeforeunload;
        }


        //set visibilitychange handle
        if (typeof document.hidden !== "undefined") {
            hidden = "hidden";
            visibilityChange = "visibilitychange";
        } else if (typeof document.mozHidden !== "undefined") {
            hidden = "mozHidden";
            visibilityChange = "mozvisibilitychange";
        } else if (typeof document.msHidden !== "undefined") {
            hidden = "msHidden";
            visibilityChange = "msvisibilitychange";
        } else if (typeof document.webkitHidden !== "undefined") {
            hidden = "webkitHidden";
            visibilityChange = "webkitvisibilitychange";
        }
        //initVisibility();
        initVisibility_1();

    };
    return ly;

}(jQuery));

ly.init();
