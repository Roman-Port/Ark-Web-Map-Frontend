<!DOCTYPE html>
<html>
    <head>
        <title>Delta Web Map / Set up Server</title>
        <?php include "/var/www/delta/site_assets/head.php"; ?>
        <link href="/assets/frontpage/me/servers/create_v2/main.css" rel="stylesheet">
    </head>
    <body>
        <?php include "/var/www/delta/site_assets/header.php"; ?>
        <div class="main_content_fit main_content" style="margin-top:40px;">
            <div id="main">
                
            </div>
        </div>

        <!-- TODO:
        
        * Icon image upload
        * After form

        -->

        <!-- Templates -->
        <template id="slide_intro">
            <div>
                <h1>Let's Get Started</h1>
                <h2>To get started, choose the platform this server is using.</h2> 
                <div class="select_item_binder">
                    <div class="select_btn select_btn_legacy" onclick="app.ShowSlide('choose_map', null, false);">Steam</div>
                    <div class="select_btn select_btn_legacy" onclick="app.ShowSlide('unsupported_platform', null, false);">Other</div>
                </div>
            </div>
        </template>

        <!-- Template for platforms that aren't supported -->
        <template id="slide_err_unsupported_platform">
            <div>
                <h1>Sorry, Unsupported Platform</h1>
                <h2>This is an unsupported platform due to restrictions put into place by consoles. Check back later.</h2> 
                <div class="select_item_binder">
                    <div class="select_btn select_btn_legacy" onclick="app.ShowSlide('intro', null, false);">Back</div>
                </div>
            </div>
        </template>

        <!-- Template for prompting the user to pick a map -->
        <template id="slide_choose_map">
            <div>
                <h1>Choose Map</h1>
                <h2>Pick a map to use on this server. If it isn't listed, it's not supported at this time.</h2> 
                <div class="select_item_binder">
                    <div class="select_btn select_btn_legacy" onclick="app.OnPickMap('TheIsland');">The Island</div>
                    <div class="select_btn select_btn_legacy" onclick="app.OnPickMap('TheCenter');">The Center</div>
                    <div class="select_btn select_btn_legacy" onclick="app.OnPickMap('ScorchedEarth');">Scorched Earth</div>
                    <div class="select_btn select_btn_legacy" onclick="app.OnPickMap('Ragnarok');">Ragnarok</div>
                    <div class="select_btn select_btn_legacy" onclick="app.OnPickMap('Aberration');">Aberration</div>
                    <div class="select_btn select_btn_legacy" onclick="app.OnPickMap('Extinction');">Extinction</div>
                    <div class="select_btn select_btn_legacy" onclick="app.OnPickMap('Valguero');">Valguero</div>
                </div>
            </div>
        </template>

        <!-- Template for Steam -->
        <template id="slide_choose_hosting">
            <div>
                <h1>Choose Hosting</h1>
                <h2>How do you host your server? If you're unsure, it's likely that you use a provider.</h2> 
                <div class="select_item_binder">
                    <div class="select_item_container">
                        <div class="select_item" onclick="app.PromptLoginReturn('self_setup');">
                            <div class="select_item_title">Self-Hosting</div>
                            <p style="margin-top: 0;">Choose this option if you run your server on your own computer by starting a program and forwarding your ports.</p>
                            <div class="select_item_btn">Select</div>
                        </div>
                    </div>
                    <div class="select_item_container">
                        <div class="select_item" onclick="app.PromptLoginReturn('hosting_provider_unsupported');">
                            <div class="select_item_title">Provider Hosted</div>
                            <p style="margin-top: 0;">Choose this option if you pay monthly or yearly for a company, such as Nitrado, to host your server for you.</p>
                            <div class="select_item_btn">Select</div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Template for hosting that aren't supported -->
        <template id="slide_err_unsupported_hosting">
            <div>
                <h1>Sorry, We're Not Ready Yet</h1>
                <h2>Provider hosting isn't quite ready yet. It will be soon. Check back shortly!</h2> 
                <div class="select_item_binder">
                    <div class="select_btn select_btn_legacy" onclick="app.ShowSlide('hosting_provider', null, false);">Back</div>
                </div>
            </div>
        </template>

        <!-- Template for prompting the user to log in after verifying that the server works -->
        <template id="slide_prompt_login">
            <div>
                <h1>Your Server is Compatible!</h1>
                <h2>We just need you to sign in to continue setup. By signing in, you agree to our <a href="/privacy/">Privacy Policy</a>.</h2> 
                <div class="select_item_binder">
                    <div class="select_btn select_btn_legacy" onclick="app.DoLoginReturn(document.x_temp_return_slide);">Sign in With Steam</div>
                </div>
            </div>
        </template>

        <!-- Template for setting up a machine for self hosting -->
        <template id="slide_self_setup">
            <div>
                <h1>Downloading Client Software</h1>
                <h2 class="download_step_container">
                    <div class="download_step_circle">1</div>
                    <div class="download_step_text">Step 1 - Download Software</div>
                </h2>
                <h2>You'll need to download a small program to sync your ARK save file with our servers. It will never write any data.</h2>
                <div class="select_item_binder">
                    <div class="select_btn">
                        <div class="select_btn_twopart_top" onclick="app.downloadUrl('https://deltamap.net/d/win');">Download Windows (x64)</div>
                        <div class="select_btn_twopart_bottom">https://deltamap.net/d/win</div>
                    </div>
                    <div class="select_btn">
                        <div class="select_btn_twopart_top" onclick="app.downloadUrl('https://deltamap.net/d/linux');">Download Linux</div>
                        <div class="select_btn_twopart_bottom">https://deltamap.net/d/linux</div>
                    </div>
                </div>
                <h2 class="download_step_container">
                    <div class="download_step_circle">2</div>
                    <div class="download_step_text">Step 2 - Extract Software</div>
                </h2>
                <h2>Extract the ZIP file you just downloaded, then run the program inside of the folder.</h1>
                <div class="download_step_normal">
                    <h2 class="download_step_container">
                        <div class="download_step_circle">3</div>
                        <div class="download_step_text">Step 3 - Type in Code</div>
                    </h2>
                    <h2>When prompted for a setup code, type in <span class="setup_code code_block">0000-0000</span> and press enter. If you can't type into the console, click <a href="javascript:app.switchToHeadless();">here</a>.</h2>
                </div>
                <div class="download_step_headless" style="display:none;">
                    <h2 class="download_step_container">
                        <div class="download_step_circle">3</div>
                        <div class="download_step_text">Step 3 - Headless Configuration</div>
                    </h2>
                    <h2>If you can't type into the console, you'll need to create a file named <span class="code_block">delta_setup_token.txt</span> in the same directory as the program. Create this file, then open it with a text editor and type in <span class="setup_code code_block">0000-0000</span>. Then, save and restart the program.</h2>
                    <img src="/assets/frontpage/me/servers/create_v2/example_headless.png">
                    <h2>Your installation directory should look like this after you save the file.</h2> 
                </div>
            </div>
        </template>

        <!-- Generic file picker -->
        <template id="slide_filepicker">
            <div>
                <h1 class="s_title"></h1>
                <h2 class="s_sub"></h2> 
                <div class="filepicker_box">
                    <div class="filepicker_sidebar">
                        <div class="filepicker_drive_select"></div>
                        <div class="filepicker_confirm_btn" onclick="app.filepicker.OnHitAcceptBtn();">Incorrect Folder</div>
                    </div>
                    <div class="filepicker_dir">
                        <div class="filepicker_dir_up" onclick="app.filepicker.GoUp();"></div>
                        <input type="text" class="filepicker_dir_input" onchange="app.filepicker.GoToDir(this.value);">
                    </div>
                    <div class="filepicker_content">
                    
                    </div>
                </div>
            </div>
        </template>

        <!-- Template for naming the server -->
        <template id="slide_self_finish">
            <div>
                <h1>Almost Ready!</h1>
                <h2>Your server is almost ready. To finish up, give your server a name.</h2>
                <div class="final_card_body">
                    <div class="final_card_name_box">
                        <div class="final_card_bold" style="margin-left:2px;">Server Name<span class="filepicker_text_err"> 2-24 Characters</span></div>
                        <input type="text" class="final_card_name_input">
                    </div>
                    <div class="final_card_cluster_box">
                        <div class="final_card_bold" style="margin-left:2px;">Cluster</div>
                        <select class="final_card_cluster_option">
                            <option>No Cluster</option>
                        </select>
                    </div>
                    <div class="final_card_icon">Add Icon</div>
                    <div class="final_card_submit">Finish</div>
                </div>
            </div>
        </template>
    </body>
    <script src="https://romanport.com/static/lib/lib_usercontent.js"></script>
    <script src="/assets/frontpage/me/servers/create_v2/main.js"></script>
    <script>app.Boot();</script>
</html>