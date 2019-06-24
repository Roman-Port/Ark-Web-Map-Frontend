var tmap = {};



tmap.init = function() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

    var renderer = new THREE.WebGLRenderer();
    tmap.renderer = renderer;
    tmap.scene = scene;
    tmap.camera = camera;
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    //Add light
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 20 );
    directionalLight.position.set(0, 50, 0);
    directionalLight.rotation.set(0, 0, 0);
    scene.add( directionalLight ); 

    //Set camera
    camera.position.y = 70;
    camera.rotation.set(-1.5708, 0, -1.5708); //Top down

    //Render one frame
    renderer.render( scene, camera );

    //Add objects
    tmap.addObject({
        "asset_url":"https://ark.romanport.com/resources/3d/structures/wood/ramp.glb",
        "pos":{
            "x":0,
            "y":0,
            "z":0
        }
    });
    tmap.addObject({
        "asset_url":"https://ark.romanport.com/resources/3d/structures/wood/floor.glb",
        "pos":{
            "x":30,
            "y":0,
            "z":0
        }
    });
    tmap.addObject({
        "asset_url":"https://ark.romanport.com/resources/3d/structures/wood/floor.glb",
        "pos":{
            "x":60,
            "y":0,
            "z":0
        }
    });
}

tmap.addObject = function(data) {
    var loader = new THREE.GLTFLoader();
    var o = new THREE.Object3D();
    loader.load( data.asset_url,
        function ( gltf ) {
            var scale = 0.1;
            o.body = gltf.scene.children[0];
            o.body.name = "body";
            o.body.rotation.set ( 0, 0, 0 );
            o.body.scale.set (scale,scale,scale);
            o.body.position.set ( data.pos.x, data.pos.y, data.pos.z );
            o.body.castShadow = true;
            o.add(o.body);
            tmap.renderer.render( tmap.scene, tmap.camera );
        },
    );
    tmap.scene.add( o );
}

tmap.init();