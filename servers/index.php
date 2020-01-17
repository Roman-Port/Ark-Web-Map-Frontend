<!DOCTYPE html>
<html>
<head>
    <title>Add your Server to Delta Web Map</title>
    <?php include "/var/www/delta/site_assets/head.php"; ?>
    <link rel="stylesheet" href="/assets/servers/manage/manage.css">
	<link href="https://fonts.googleapis.com/css?family=Source+Code+Pro&display=swap" rel="stylesheet">
</head>
<body class="">
    <div class="loaderbar"><div class="loaderbar_bar"></div></div>
    <div class="left_sidebar">
        <!--<div class="left_sidebar_top attrib_loaded_content">
            <img src="" class="left_sidebar_top_image" id="load_img"/>
            <div class="left_sidebar_top_title" id="load_title"></div>
            <div class="left_sidebar_top_subtitle" id="load_cluster"></div>
        </div>
        <div class="left_sidebar_content attrib_loaded_content">
            <div onclick="OnSwitchTab(this);" class="left_sidebar_button left_sidebar_button_active" data-tab="overview">Overview</div>
            <div onclick="OnSwitchTab(this);" class="left_sidebar_button" data-tab="permissions">Permissions</div>
            <div onclick="OnSwitchTab(this);" class="left_sidebar_button" data-tab="disable">Disable</div>
            <div onclick="OnSwitchTab(this);" class="left_sidebar_button" data-tab="remove">Remove</div>
        </div>-->
    </div>

	<div class="statusbar_content">
		<div class="statusbar_status_container">
			<div class="statusbar_status_icon statusbar_status_icon__offline"></div>
			<div class="statusbar_status_text">Offline Since 12/31/1969</div>
		</div>
		<img class="statusbar_icon" src="https://icon-assets.deltamap.net/legacy/placeholder_server_images/T.png" />
		<div class="statusbar_name">Test ARK!</div>
		<div class="statusbar_subtitle">Extinction &#183; Test Cluster</div>
	</div>

    <div class="right_content attrib_loaded_content">
		<div class="right_content_nav">
			<div onclick="OnSwitchTab(this);" class="right_content_nav_option right_content_nav_option_selected" data-tab="overview">Overview</div>
			<div onclick="OnSwitchTab(this);" class="right_content_nav_option" data-tab="permissions">Permissions</div>
			<div onclick="OnSwitchTab(this);" class="right_content_nav_option" data-tab="disable">Disable</div>
			<div onclick="OnSwitchTab(this);" class="right_content_nav_option" data-tab="remove">Remove</div>
		</div>

		<div class="right_content_tab">
			<div class="delta_tab_content active_delta_tab" id="tab_overview">
				
			</div>

			<div class="delta_tab_content" id="tab_permissions">
				<p>Here, you can manage all of the enabled features for all users. You can restrict or disable features that you deem too powerful.</p>
				<dbox class="dbox_warn">Server members will be notified if you toggle some features.</dbox>
			</div>

			<div class="delta_tab_content" id="tab_disable">
				<p>Disabling your server will temporarily restrict access to it. </p>
			</div>

			<div class="delta_tab_content" id="tab_remove">
				<p>Removing your server will delete all canvases, user settings, and other saved content from Delta Web Map servers immediately for all users. This action is permanent and cannot be undone, even by support.</p>
				<p>This action will also remove all ARK data from our servers, but will not impact your game server.</p>
				<dbox class="dbox_warn">Removing your Delta Web Map server will not delete any content from your game server.</dbox>
				<p>You may also consider disabling your server instead if you wish to temporarily restrict access to it. Disabling your server will allow you to restore it at any time, while removing it is a permanent action. Removing your server cannot be undone, even by support.</p>
				<dbox class="dbox_alert">You must remove the Delta Web Map mod from your server before removing it. If you don't, your server will be added again the next time your ARK server reboots.</dbox>
				<p>To confirm, type the name of your server into the box below. Then, press the remove button.</p>
				<input type="text" placeholder="Confirm" /> <dbtn>Remove</dbtn>
			</div>

		</div>
    </div>

	<!-- Server creation -->
	<table class="serverdialog_box_container">
		<tr>
			<td style="text-align: center; vertical-align: middle;">
				<div class="serverdialog_box">
					<div class="serveridalog_box_top">Add ARK Server</div>

					<div class="serveridalog_box_content" id="serverdialog_box_content">
						<div class="serveridalog_box_tab">
							<h2>Welcome to Delta Web Map!</h2>
							<p>DeltaWebMap allows tribes to view and manage their ARK tribes whilst keeping the game fair and competitive. You, as the server owner, can teak DeltaWebMap to your liking.</p>
							<p>You'll be guided through these steps to get your server set up. Setup will take less than three minutes.</p>
							<div>
								<div class="serverctab_welcome_step"><div class="serverctab_welcome_step_bubble">1</div><b>Configure your Server</b> by adding two lines in your server settings</div>
								<div class="serverctab_welcome_step"><div class="serverctab_welcome_step_bubble">2</div><b>Install the ARK Mod</b> from the Steam Workshop</div>
								<div class="serverctab_welcome_step"><div class="serverctab_welcome_step_bubble">3</div><b>Join your Server</b> to get access to your tribe</div>
							</div>
						</div>

						<div class="serveridalog_box_tab">
							<h2>Choose your Hosting Provider</h2>
							<p>For better instructions, choose your current hosting provider. Even if your provider isn't listed, it's likely that they are still supported.</p>
							<div style="text-align:center;">
								<b>Provider</b><br>
								This is the most common choice. Choose if you pay for hosting.
								<ul class="clist" style="margin-top:15px;">
									<li class="serverctab_btn_generic serverctab_btn_provider" onclick="OnPickSetupProvider('arkserversio');" style="background-image:url(/assets/servers/providers/arkserversio/logo-white.png);"></li>
								</ul>
							</div>
							<div class="serverctab_provider_div"></div>
							<div style="text-align:center;">
								<b>Self-Hosted Server</b><br>
								Servers you run yourself. You'll know if you use this option.
								<div class="serverctab_btn_generic serverctab_btn_provider" style="margin:15px auto;">Self-Hosted</div>
							</div>
							<div class="serverctab_provider_div"></div>
							<div style="text-align:center;">
								<b>Provider not listed?</b><br>
								It's likely that they are still supported!
								<div class="serverctab_btn_generic serverctab_btn_provider" style="margin:15px auto;">Skip</div>
							</div>
						</div>

						<div class="serveridalog_box_tab">
							<h2>Security Settings</h2>
							<p>Some server owners, especially owners of PVP servers, would like to prevent players from accessing Delta Web Map before they have a chance to configure it. Here, you can lock your server until you choose to unlock it later.</p>
							<p>Most server owners will choose to ignore this option and leave this be.</p>
							<div id="serverctab_lock_btns">
								<div class="serverctab_lock_btn" onclick="SetServerLockStatus(false);"><div class="serverctab_lock_btn_light"></div><b>Unlock This Server</b><br>This is the default option that will allow anyone on the server to access their tribe data immediately.<br><br><i>Choose this option if you're unsure.</i></div>
								<div class="serverctab_lock_btn" onclick="SetServerLockStatus(true);"><div class="serverctab_lock_btn_light"></div><b>Lock This Server</b><br>This option will prevent any player other than you from accessing Delta Web Map on your server until you manually unlock the server. This will give you time to configure it.<br><br><i>Consider this option if you are adding Delta Web Map to an existing server.</i></div>
							</div>
						</div>

						<div class="serveridalog_box_tab" id="serverdialog_custom_steps">
							
						</div>

						<div class="serveridalog_box_tab">
							<h2 style="text-align:center;">Setting Up...</h2>
							<p style="max-width:500px; margin:auto; text-align:center; margin-bottom:20px; color:#616161;">We're waiting for your server to start.<br>This screen will change automatically when it's ready!</p>
							<p style="max-width:500px; margin:auto; text-align:center; margin-bottom:20px; color:#616161;">In the mean time, consider joining out <a href="https://discord.gg/99TcfCT" target="_blank">Discord</a></p>
							<p style="max-width:500px; margin:auto; text-align:center; margin-bottom:20px; color:#616161;">This should only take a few minutes</p>
						</div>
					</div>

					<div class="serverdialog_box_bottom">
						<dbtn class="serverdialog_box_bottom_btn" onclick="OnSlideNextBtn();" id="serverdialog_box_bottom_btn">Next</dbtn>
						<div class="serverdialog_box_bottom_bar">
							<div class="serverdialog_box_bottom_bar_filling" id="serverdialog_box_bottom_bar_filling"></div>
						</div>
					</div>
				</div>
			</td>
		</tr>
	</table>
	<table class="mediabox_container" id="mediabox_container" onclick="document.body.classList.remove('state_media');">
		<tr>
			<td style="text-align: center; vertical-align: middle;">
				<div class="mediabox_content" id="mediabox_content"></div>
			</td>
		</tr>
	</table>

	<script src="/assets/servers/manage/static.js"></script>
    <script src="/assets/servers/manage/manage.js"></script>
</body>
</html>