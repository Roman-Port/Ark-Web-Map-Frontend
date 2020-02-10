<!DOCTYPE html>
<html style="background-color:##252629;">
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Logging In... / Delta Web Map</title>
    <?php include "/var/www/delta/site_assets/head.php"; ?>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        html, body {
            background-color: #1a1a1c;
        }
    </style>
</head>
<body>
    
    <script src="/enviornment.js"></script>
    <script>
    function DoLogin() {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var reply = JSON.parse(this.responseText);
                if (reply.nonce != parseInt(localStorage.getItem("login_latest_nonce"))) {
                    window.location = "/login/"; //Failed
                    return;
                }
                localStorage.setItem("access_token", reply.token);
                localStorage.removeItem("login_latest_nonce");
                window.location = reply.next;
            } else if(this.readyState == 4) {
                window.location = "/login/"; //Failed
            }
        }
        xmlhttp.open("GET", LAUNCH_CONFIG.API_ENDPOINT + "/auth/token?state=" + encodeURIComponent(delta.parseURLParams()["state"]), true);
        xmlhttp.send();
    }

    window.setTimeout(DoLogin, 800);
    </script>

</body>
</html>