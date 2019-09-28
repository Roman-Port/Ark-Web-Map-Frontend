<!DOCTYPE html>
<html>
    <head>
        <title>Delta Web Map / Add Server</title>
        <?php include "/var/www/delta/site_assets/head.php"; ?>
        <link href="/assets/frontpage/me/servers/create/me_servers.css" rel="stylesheet">
    </head>
    <body>
        <?php include "/var/www/delta/site_assets/header.php"; ?>
        <div class="main_content_fit main_content">
            <div class="status_warning" id="warning_bar" style="display:none;"></div>
            <div id="main">
                
            </div>
        </div>

        <!-- Template slides -->
        <template id="slide_intro">
            <div>
                <h1>Add Servers</h1>
                <p>Before we get started, please choose some information about your servers. We'll tell you if your server is supported.</p>

                <user-option-form class="form_platform">
                    <user-option-form-title>Platform</user-option-form-title>
                    <user-option-form-description>This is the console or platform that you play the game on. <u>If you're on Windows 10 and run the game through the Xbox app, choose Xbox.</u></user-option-form-description>
                    <user-option-form-error>Unfortunately, we can only support PC at this time because we cannot access the server save file.</user-option-form-error>
                    <user-option-form-options>
                        <user-option-element data-name="pc" data-error="-1" onclick="FormClickElement(this); ShowFormOption('form_hosting');" class=""><user-option-element-title>PC</user-option-element-title></user-option-element>
                        <user-option-element data-name="mac" data-error="-1" onclick="FormClickElement(this); ShowFormOption('form_hosting');"><user-option-element-title>Mac OS</user-option-element-title></user-option-element>
                        <user-option-element data-name="linux" data-error="-1" onclick="FormClickElement(this); ShowFormOption('form_hosting');"><user-option-element-title>Linux</user-option-element-title></user-option-element>
                        <user-option-element data-name="xbox" data-error="1" onclick="FormClickElement(this)"><user-option-element-title>Xbox</user-option-element-title></user-option-element>
                        <user-option-element data-name="ps4" data-error="1" onclick="FormClickElement(this)"><user-option-element-title>PS4</user-option-element-title></user-option-element>
                        <user-option-element data-name="other" data-error="1" onclick="FormClickElement(this)"><user-option-element-title>Other</user-option-element-title></user-option-element>
                    </user-option-form-options>
                </user-option-form>

                <user-option-form class="form_hosting user-option-form-hidden">
                    <user-option-form-title>Hosting</user-option-form-title>
                    <user-option-form-description>This is where your server is being operated. If you don't know, you're likely using a provider.</user-option-form-description>
                    <user-option-form-error>Unfortunately, we only support self hosting right now. You should ask your server provider to integrate Delta Web Map into their services. If you're a provider, click <a href="/providers/">here</a>.</user-option-form-error>
                    <user-option-form-options>
                        <user-option-element data-name="self" data-error="-1" onclick="FormClickElement(this); ShowFormOption('form_type');" class="user-option-element-description"><user-option-element-title>Self</user-option-element-title><user-option-element-description>Use this option if you run your server off of your own computer by running ShooterGameServer.exe.<br><br>If you use this option, you'll need to download our light client program to read your ARK save file.</user-option-element-description></user-option-element>
                        <user-option-element data-name="provider" data-error="-1" onclick="FormClickElement(this); ShowFormOption('form_type');" class="user-option-element-description"><user-option-element-title>Provider</user-option-element-title><user-option-element-description>Use this option if you pay monthly/yearly for someone else to host your server for you, such as Nitrado.<br><br>If you use this option, you'll need to provide FTP credentials so we can download your ARK save file.</user-option-element-description></user-option-element>
                    </user-option-form-options>
                </user-option-form>

                <user-option-form class="form_type user-option-form-hidden">
                    <user-option-form-title>Server Type</user-option-form-title>
                    <user-option-form-description>This is the type of server you host. If you don't know, your server is likely to be a single server.</user-option-form-description>
                    <user-option-form-error>This form is not for you. Please see our <a href="/providers/">providers page</a> for information about how to integrate Delta Web Map into your services. We'd love to have you.</user-option-form-error>
                    <user-option-form-options>
                        <user-option-element data-name="single" data-error="-1" onclick="FormClickElement(this); ShowFormOption('form_map user-option-errored');" class="user-option-element-description"><user-option-element-title>Single</user-option-element-title><user-option-element-description>This is the most common option. Use this if your unoffical server does not allow uploads/downloads to other servers.</user-option-element-description></user-option-element>
                        <user-option-element data-name="cluster" data-error="-1" onclick="FormClickElement(this); ShowFormOption('form_map user-option-errored');" class="user-option-element-description"><user-option-element-title>Cluster</user-option-element-title><user-option-element-description>Use this option if you operate multiple servers that support uploads/downloads to each other. You'll know if you use this option.</user-option-element-description></user-option-element>
                        <user-option-element data-name="provider" data-error="1" onclick="FormClickElement(this);" class="user-option-element-description"><user-option-element-title>Provider</user-option-element-title><user-option-element-description>Use this option if you provide servers to other users for a fee. Normal users will not use this option.</user-option-element-description></user-option-element>
                    </user-option-form-options>
                </user-option-form>

                <user-option-form class="form_map user-option-errored user-option-form-hidden">
                    <user-option-form-title>ARK Maps</user-option-form-title>
                    <user-option-form-description>Select all of the map(s) that your server(s) use.</user-option-form-description>
                    <user-option-form-error>A map you selected is currently unsupported, but support may be added soon. Click <a href="/request/map/">here</a> to request a map.</user-option-form-error>
                    <user-option-form-error-select style="display:block;">You need to select at least one map.</user-option-form-error-select>
                    <user-option-form-options>
                        <user-option-element data-name="0" data-error="1" onclick="FormSelectMultipleClickElement(this); ShowFormOption('form_submit');"><user-option-element-title>The Island</user-option-element-title></user-option-element>
                        <user-option-element data-name="1" data-error="-1" onclick="FormSelectMultipleClickElement(this); ShowFormOption('form_submit');"><user-option-element-title>The Center</user-option-element-title></user-option-element>
                        <user-option-element data-name="2" data-error="1" onclick="FormSelectMultipleClickElement(this); ShowFormOption('form_submit');"><user-option-element-title>Scorched Earth</user-option-element-title></user-option-element>
                        <user-option-element data-name="3" data-error="1" onclick="FormSelectMultipleClickElement(this); ShowFormOption('form_submit');"><user-option-element-title>Aberration</user-option-element-title></user-option-element>
                        <user-option-element data-name="4" data-error="-1" onclick="FormSelectMultipleClickElement(this); ShowFormOption('form_submit');"><user-option-element-title>Extinction</user-option-element-title></user-option-element>
                        <user-option-element data-name="5" data-error="1" onclick="FormSelectMultipleClickElement(this); ShowFormOption('form_submit');"><user-option-element-title>Other</user-option-element-title></user-option-element>
                    </user-option-form-options>
                </user-option-form>

                <user-option-form-submit class="user-option-form-hidden form_submit" onclick="SubmitIntroForm();">Add your First Server</user-option-form-submit>
            </div>
        </template>
        <template id="slide_login">
            <div>
                <h1>Login</h1>
                <p>To continue, we'll need you to log in with Steam. By signing in, you're agreeing to our <a href="/privacy/">Privacy Policy</a>.</p>
                <img src="/assets/sign_in_with_steam.png" style="margin-top:5px; cursor:pointer;" onclick="DoLogin();">
            </div>
        </template>
        <template id="slide_cluster_setup">
            <div>
                <h1>Set Up Cluster</h1>
                <p>All servers you add now will be added to this cluster. You'll need to name your cluster first.</p>

                <user-option-form class="form_name user-option-errored">
                    <user-option-form-title>Cluster Name</user-option-form-title>
                    <user-option-form-description>Type a name for your cluster. This'll be displayed inside of the app.</user-option-form-description>
                    <user-option-form-error style="display:block;">Your name must be between 2-24 characters.</user-option-form-error>
                    <input type="text" oninput="FormTypeElement(this);" placeholder="Cluster Name" class="input_box user-option-custom form_name_value">
                </user-option-form>

                <user-option-form-submit onclick="SubmitClusterForm(this);">Create Cluster</user-option-form-submit>
            </div>
        </template>
        <template id="slide_setup">
            <div>
                <h1>Set Up A New Server</h1>
                <p>For each server you add, we'll need this info. Please choose some information about this server.</p>

                <user-option-form class="form_name user-option-errored">
                    <user-option-form-title>Server Name</user-option-form-title>
                    <user-option-form-description>Type a name for your server.</user-option-form-description>
                    <user-option-form-error style="display:block;">Your server name must be between 2-24 characters.</user-option-form-error>
                    <input type="text" oninput="FormTypeElement(this);" placeholder="Server Name" class="input_box user-option-custom form_name_value">
                </user-option-form>

                <user-option-form class="form_icon">
                    <user-option-form-title><i>Optional</i> Server Icon</user-option-form-title>
                    <user-option-form-description>Optionally, you can upload an image for your server. This'll be displayed to people in your server.</user-option-form-description>
                    <user-option-form-error>Your image failed to upload.</user-option-form-error>
                    <div class="g_header_big_btn g_header_big_btn_go user-option-custom">Upload Icon</div>
                </user-option-form>

                <user-option-form class="form_map">
                    <user-option-form-title>ARK Map</user-option-form-title>
                    <user-option-form-description>Choose the map that this server will use.</user-option-form-description>
                    <user-option-form-error>A map you selected is currently unsupported, but support may be added soon. Click <a href="/request/map/">here</a> to request a map.</user-option-form-error>
                    <user-option-form-options>
                        <user-option-element data-name="0" data-error="1" onclick="FormClickElement(this)"><user-option-element-title>The Island</user-option-element-title></user-option-element>
                        <user-option-element data-name="1" data-error="-1" onclick="FormClickElement(this)"><user-option-element-title>The Center</user-option-element-title></user-option-element>
                        <user-option-element data-name="2" data-error="1" onclick="FormClickElement(this)"><user-option-element-title>Scorched Earth</user-option-element-title></user-option-element>
                        <user-option-element data-name="3" data-error="1" onclick="FormClickElement(this)"><user-option-element-title>Aberration</user-option-element-title></user-option-element>
                        <user-option-element data-name="4" data-error="-1" onclick="FormClickElement(this)"><user-option-element-title>Extinction</user-option-element-title></user-option-element>
                        <user-option-element data-name="5" data-error="1" onclick="FormClickElement(this)"><user-option-element-title>Other</user-option-element-title></user-option-element>
                    </user-option-form-options>
                </user-option-form>

                <user-option-form-submit onclick="SubmitSetupForm();">Next Step</user-option-form-submit>
            </div>
        </template>
        <template id="slide_setup_download">
            <div>
                <h1>Set Up A New Server</h1>
                <p>Delta Web Map uses a client program you must download to your servers. This program quietly sits in the background and reads your ARK save file. It will never write data, but it is required to make Delta Web Map work.</p>
                <p>This program requires access to your ARK save file and an internet connection.</p>
                <p>To get started, click <a href="https://download.deltamap.net/" target="_blank">here</a> to download the program for the platform you selected. Run it, and then type in the code it gives you into the box below.</p>
                <input type="number" oninput="OnTypeServerCode(this.value);" placeholder="123456" class="input_box"> <a class="headless_download_btn" href="javascript:OnClickHeadlessSetupBtn();">Switch to Headless Setup</a>
                <box_info class="headless_download_area" style="display:none;">Headless setup is for advanced systems where you cannot see the program output.<br><br>To set up a headless system, click <a href="" target="_blank" class="headless_download_link">here</a> to download the headless config file. Place this file in the Delta Web Map program folder and ensure it is named <u>headless_setup.json</u>. Then, launch the program as usual.<br><br>This screen will change automatically when you've correctly configued this file.</box_info>
            </div>
        </template>
        <template id="slide_setup_files">
            <div>
                <h1>Set Up A New Server</h1>
                <p>The last step in the server setup is to choose where your ARK save files are located.</p>

                <user-option-form class="form_save">
                    <user-option-form-title>ARK Save Location</user-option-form-title>
                    <user-option-form-description>Choose the folder your ARK server save file is in. This file is usually in /ShooterGame/Saved/SavedArks/.</user-option-form-description>
                    <user-option-form-error class="form_save_error user-option-errored" style="display:block;">This is required.</user-option-form-error>
                    <div class="g_header_big_btn g_header_big_btn_go" onclick="BeginPickSavePath();">Picker</div>
                </user-option-form>

                <user-option-form class="form_config">
                    <user-option-form-title>ARK Config Location</user-option-form-title>
                    <user-option-form-description>Type the pathname to the ARK config. This file is usually in /ShooterGame/Saved/Config/WindowsServer/.</user-option-form-description>
                    <user-option-form-error class="form_config_error user-option-errored" style="display:block;">This is required.</user-option-form-error>
                    <div class="g_header_big_btn g_header_big_btn_go" onclick="BeginPickConfigPath();">Picker</div>
                </user-option-form>

                <user-option-form-submit onclick="OnSubmitServerSaveSelect();">Save and Finish</user-option-form-submit>
            </div>
        </template>
        <template id="slide_setup_doconfig">
            <div></div>
        </template>
        <template id="slide_setup_done">
            <div></div>
        </template>

        <!-- Scripts -->
        <script src="/assets/frontpage/me/servers/create/me_servers.js"></script>
    </body>
</html>