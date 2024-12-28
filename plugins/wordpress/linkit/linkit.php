<?php

/**
 * @package LinkiT
 * @version 1.0.0.
 */
/*
Plugin Name: LinkiT
Plugin URI: http://thecrazyducks.com/linkit
Description: A Personalized AI Chat Bot by TheCrazyDucks
Author: TheCrazyDucks
Version: 1.0.0
Author URI: http://thecrazyducks.com
*/
//session_start();

function linkit_page_init()
{
    $token = get_option("linkit-token", "damm");
    if (isset($_POST["access_key"])) {
        // echo "GOOD";
        update_option("linkit-token", esc_js($_POST["access_key"]));
        $token = $_POST["access_key"];
        // header("Location:" . __FILE__);
        unset($_POST);
    }

?>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Fredoka:wght@300..700&display=swap');

        .linkit-settings-container {
            font-family: "Be Vietnam Pro";
            /* width: 100%; */
            display: flex;
            flex-direction: column;
            color: #f0f0f0;
            width: calc(100% - 6em);
            margin: 2em;
            padding: 1em;
            /* height: 100vh; */
            background: #222;
            border-radius: 1em;
            /* height: calc(90vh - 6em); */
            /* display: flex;
            align-items: center;
            justify-content: center;
            position: relative; */
        }

        .linkit-settings-header {
            width: 100%;
            display: flex;
            justify-content: space-between;
        }

        .linkit-settings-title {
            /* position: absolute; */
            font-size: 1.1em;
            font-weight: 500;
            padding: .75em 1.75em;
            background: #171717;
            border-radius: 4em;
            margin-bottom: 2em;
            font-style: italic;
            width: fit-content;
        }

        .linkit-settings {
            width: 100%;
            flex: 1;
        }

        .linkit-settings-container input {
            padding: .75em 1em;
            min-height: unset;
        }

        input {
            color: #a9a9a9;
            outline: none;
            font-size: 1.2em;
            display: block;
            margin: 1em auto;
            background: #333;
            border: none;
            border-bottom: .175em solid #333;
            width: calc(100% - 4em);
            border-radius: .5em;
            transition: color .5s ease, border-color .5s ease;
	    -webkit-text-security: disc;
	    text-security: disc; 
        }

        input:focus {
            color: #f0f0f0;
            border-color: #444;
        }

        button[type="submit"] {
            display: block;
            margin: 1em auto;
            border-radius: 0;
            background: #f0f0f0;
            color: #222;
            font-weight: 600;
            font-size: 1.2em;
            border: none;
            -webkit-appearance: none;
            appearance: none;
            min-height: none;
            height: fit-content;
            /* padding: 1em 7em; */
            padding: .75em 2.5em;
            margin-top: 3em;
            border-radius: 3em;
            cursor: pointer;
            transition: transform .5s ease;
        }

        button[type="submit"]:hover {
            box-shadow: 0 .5em .5em #00000010;
            transform: translateY(-2px);
        }

        .linkit-settings-section {
            margin: 1em 0;
        }

        .linkit-settings-section>div:nth-of-type(1) {
            font-size: 1.2em;
            margin-left: 2.5em;
        }

        .linkit-settings-copyright{
            font-size: .95em;
            display: flex;
            margin-left: auto;
            align-items: center;
            font-weight: 400;
        }

        .linkit-settings-copyright div{
            opacity: .65;
        }

        .n-s{
            user-select: none;
            -webkit-user-drag: none;
            -webkit-user-select: none;
            -moz-user-select: none;
        }

        #thecrazyducks {
            height: 1em;
            margin: 0 .5em 0 .5em;
        }
    </style>
    <script>
        if (window.history.replaceState) {
            window.history.replaceState(null, null, window.location.href);
        }
    </script>
    <div class="linkit-settings-container">
        <div class="linkit-settings-header n-s">
            <div class="linkit-settings-title">
                LinkiT<span style="opacity: .75;">
                    's Settings
                </span>
            </div>
        </div>
        <div class="linkit-settings">
            <form action="" method="post">
                <script>
                    if (window.history.replaceState) {
                        window.history.replaceState(null, null, window.location.href);
                    }
                </script>
                <div class="linkit-settings-section">
                    <div>
                        Access Token
                    </div>
                    <input name="access_key" placeholder="Secret Token" value="<?php echo esc_html($token) ?>" />
                </div>
                <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                <button type="submit" class="n-s">Save</button>
            </form>
        </div>
        <div class="linkit-settings-copyright n-s">
            <div>all rights reserved 2025 @ </div>
            <img id="thecrazyducks" src="https://cdn.thecrazyducks.com/logo.png" />
        </div>
    </div>
<?php
    // register_setting('linkit', 'linkit_options');
}

function linkit_options_page()
{
    add_options_page('LinkiT', 'LinkiT Settings', 'manage_options', 'linkit_settings', 'linkit_page_init');
}

add_action('admin_menu', 'linkit_options_page');

function linkit_page_load() {}

function linkit_chat(){

	if(is_admin() && !(is_front_page() || is_home() )){
		echo "ahahahahahahahahaahahhahahahahah";
		return false;
	}


	$url = 'https://service.thecrazyducks.com/linkit/token';
	$data = ["key" => get_option("linkit-token")];
	$options = [
		'http' => [
			'method' => 'POST',
		'header' => 'Content-type: application/x-www-form-urlencoded',
		'content' => http_build_query($data)
		]
	];
	//echo var_dump($options);
	$context = stream_context_create($options);
	$response = file_get_contents($url, false, $context);
	//echo var_dump($response);
	$json = json_decode($response);
	//echo var_dump($json);
	echo $json->token;

	echo '<link href="https://cdn.thecrazyducks.com/linkit-chat.css" rel="stylesheet">';
	echo '
		<style>
		.linkit-container {
			font-size: 1rem;
		}
	</style>';
	echo '<script async="false" defer="false" id="linkit" src="https://cdn.thecrazyducks.com/linkit-chat.js"></script>';
	?>
	<script>
		let token = '<?php echo esc_js($json->token) ?>'
		setTimeout(()=>{
				window.dispatchEvent(new Event("init-linkit"))
				window.dispatchEvent(new CustomEvent("connect-linkit", {
					detail: { token }
				}))
				}, 1000)
		document.querySelector("#linkit").onload = ()=>{
			console.log("loaded")
		}
		window.addEventListener("linkit-ready", ()=>{
			
		})
	</script>
		<?php
}

add_action('wp_footer', 'linkit_chat');
// add_action('admin_post_linkit_form', 'linkit_page_load');
