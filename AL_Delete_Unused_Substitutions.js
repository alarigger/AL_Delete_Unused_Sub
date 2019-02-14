function AL_Delete_Unused_Substitutions() {

    /*Delete substitution of the selected drawings that are not exposed inbetween the render brackets of the timeline. 
     */



    /***************** V A R I A B L E S */



    var curFrame = frame.current();

    var sceneFrames = frame.numberOf();

    var numSelLayers = Timeline.numLayerSel;

    var substituions_tab = {

        columns: [],

        drawings: [],

        substitions: [],

    };

    var FILES_TAB = {

        paths: [],

        used_in_scene: [],

        deleted: []

    }

 	var rapport = "No unexposed substitutions to delete"


    /**************** E X E C U T I O N */



    scene.beginUndoRedoAccum("Delete_unexposed_substitutions");

    build_file_tab()

    check_unused_sub_files()

    ConfirmDialog()

    scene.endUndoRedoAccum();



    /**************** F U N C T I O N S */




    function ConfirmDialog() {

        //MessageLog.trace("\n===================ConfirmDialog\n")

        if (Find_Unexposed_Substitutions()) {

            var d = new Dialog

            d.title = "Delete_unexposed_substitutions";

            rapport = "The following subsitutions will be deleted : "


            for (var c = 0; c < substituions_tab.columns.length; c++) {

                var currentColumn = substituions_tab.columns[c];

                var drawing = substituions_tab.drawings[c];

                for (var u = 0; u < substituions_tab.substitions[c].length; u++) {

                    var sub_to_delete = substituions_tab.substitions[c][u];

                    rapport += "\n" + drawing + " : " + sub_to_delete;
                }

            }

            MessageLog.trace(rapport);

            if (rapport.length > 500) {
                rapport = "Sorry too much informations to display please see the MessageLog"

            }

            MessageBox.information(rapport)


            var rc = d.exec();

            if (rc) {

                Delete_Substitutions();

            }


        } else {

        	MessageLog.trace(rapport);

            if (rapport.length > 500) {
                rapport = "Sorry too much informations to display please see the MessageLog"

            }

            MessageBox.information(rapport);

        }

    }


    /* FILE MANAGEMENT */



    function build_file_tab() {

        //MessageLog.trace("\n===============build_file_tab\n")

        FILES_TAB = {

            paths: [],

            used_in_scene: [],

            deleted: []

        }

        var SceneDrawings = node.getNodes(['READ']);

        for (var d = 0; d < SceneDrawings.length; d++) {

            var drawing_node = SceneDrawings[d]

            var drawing_node_element_id = node.getElementId(drawing_node);

            for (var j = 0; j < Drawing.numberOf(drawing_node_element_id); j++) {
                var drawingName = Drawing.name(drawing_node_element_id, j);

                var drawingFileName = Drawing.filename(drawing_node_element_id, drawingName)

                store_file_path(drawingFileName);

            }

        }

    }


    function check_unused_sub_files() {

       // MessageLog.trace("\n===============check_unused_sub_files\n")

        for (var i = 0; i < Timeline.numLayers; i++) {

            if (Timeline.layerIsColumn(i)) {

                var currentColumn = Timeline.layerToColumn(i);

                if (column.type(currentColumn) == "DRAWING") {

                    var drawing_node = Timeline.layerToNode(i);

                    var drawing_id = node.getElementId(drawing_node)

                    for (var f = 0; f < sceneFrames + 1; f++) {

                        var current_sub = column.getEntry(currentColumn, 1, f);

                        if (current_sub != "") {

                            var sub_file = Drawing.filename(drawing_id, current_sub)

                            if (is_file_used_in_scene(sub_file) == false) {

                                mark_file_as_used(sub_file);

                            }

                        }

                    }


                }

            }

        }


        //MessageLog.trace(FILES_TAB.paths)
        //MessageLog.trace(FILES_TAB.used_in_scene)


    }


    function store_file_path(filename) {

       // MessageLog.trace("\n=======store_file_path\n")

        if (!includes(FILES_TAB.paths, filename)) {

            FILES_TAB.paths.push(filename);

            FILES_TAB.used_in_scene.push(false)

            FILES_TAB.deleted.push(false)

            //MessageLog.trace(filename)

        }

    }



    function get_sub_file_name(drawingnode, subname) {

        var drawing_id = node.getElementId(drawingnode);

        return Drawing.filename(drawing_id, subname);

    }



    function is_file_used_in_scene(filename) {

        //MessageLog.trace("\n=======is_file_used_in_scene\n")

        for (var f = 0; f < FILES_TAB.paths.length; f++) {
            if (FILES_TAB.paths[f] == filename) {

                return FILES_TAB.used_in_scene[f]
            }

        }

    }


    function mark_file_as_used(filename) {

       // MessageLog.trace("\n=======Mark_file_as_used\n")

        for (var f = 0; f < FILES_TAB.paths.length; f++) {

            if (FILES_TAB.paths[f] == filename) {

                FILES_TAB.used_in_scene[f] = true;

                return true

            }
        }

        return false;

    }

    function mark_file_as_deleted(filename) {


       // MessageLog.trace("\n=======Mark_file_as_deleted\n")

        for (var f = 0; f < FILES_TAB.paths.length; f++) {

            if (FILES_TAB.paths[f] == filename) {

                FILES_TAB.deleted[f] = true;

                return true

            }
        }

        return false;

    }



    function is_file_deleted(filename) {


       // MessageLog.trace("\n=======is_file_deleted\n")

        for (var f = 0; f < FILES_TAB.paths.length; f++) {
            if (FILES_TAB.paths[f] == filename) {

                return FILES_TAB.deleted[f];
            }

        }

    }

    /*SUBSTITUTION CLASS*/

    function Substitution(subname, subfile, linkeddrawings) {

        this.subname = subname;
        this.subfile = subfile;
        this.linkeddrawings = linkeddrawings;

    }



    function Find_Unexposed_Substitutions() {
//
        MessageLog.trace("\n===============Find_Unexposed_Substitutions\n")

        for (var i = 0; i < numSelLayers; i++) {

            if (Timeline.selIsColumn(i)) {

                var currentColumn = Timeline.selToColumn(i);

                if (column.type(currentColumn) == "DRAWING") {

                    var drawing_node = Timeline.selToNode(i);

                    var substitution_timing = column.getDrawingTimings(currentColumn);

                    var unexposed_subs = substitution_timing;


                    //on fait la liste des subs non exposées par le drawing
                    var indexToRemove = "";

                    for (var f = 0; f < sceneFrames + 1; f++) {

                        var current_substitution = column.getEntry(currentColumn, 1, f);

                        /*on elève les sub exposées de la liste*/


                        if (current_substitution != "") {

                            indexToRemove = unexposed_subs.indexOf(current_substitution);

                            if (indexToRemove > -1) {
                                unexposed_subs.splice(indexToRemove, 1);
                            }

                        }



                    }

                    /* on verifie si les sub non exposés ne sont pas exposés dans d'autres drawing clonés*/

                    var unused_subs = []

                    for (var u = 0; u < unexposed_subs.length + 1; u++) {

                       MessageLog.trace(u)
                        MessageLog.trace(unexposed_subs[u])

                        var sub_linked_file = get_sub_file_name(drawing_node, unexposed_subs[u])

                        if (is_file_used_in_scene(sub_linked_file) == false) {

                            unused_subs.push(unexposed_subs[u])

                        }




                    }

                    MessageLog.trace(drawing_node + " --- " + unused_subs);

                    if (unused_subs.length > 0) {

                        substituions_tab.columns.push(currentColumn);

                        substituions_tab.drawings.push(drawing_node);

                        substituions_tab.substitions.push(unused_subs);

                    }else{

                    	

                    }

                }

            }

        }

       // MessageLog.trace(substituions_tab);

        if (substituions_tab.columns.length > 0) {

            return true

        }

        

        return false;

    }

    function Delete_Substitutions() {

        //MessageLog.trace("\n===================Delete_Substitutions\n")

        for (var c = 0; c < substituions_tab.columns.length; c++) {

            var currentColumn = substituions_tab.columns[c];

            var displayed_subs = column.getEntry(currentColumn, 1, curFrame);

            for (var u = 0; u < substituions_tab.substitions[c].length; u++) {

                var sub_to_delete = substituions_tab.substitions[c][u];

                column.setEntry(currentColumn, 1, curFrame, sub_to_delete);

                var sub_file = get_sub_file_name(substituions_tab.drawings[c], sub_to_delete)

                if (!is_file_deleted(sub_file)) {

                    column.deleteDrawingAt(currentColumn, curFrame)
                    MessageLog.trace("SUBSTITION " + sub_to_delete + " DELETED")

                    mark_file_as_deleted(sub_file)

                }



            }

            column.setEntry(currentColumn, 1, curFrame, displayed_subs);


        }

    }


    /* FUNCTION UTILS */

    function Hypothenus(x, y) {
        return Math.sqrt((x * x) + (y * y));
    }

    function radian(a) {
        return a * Math.PI / 180
    }

    function includes(array, item) {

        for (var i = 0; i < array.length; i++) {
            if (array[i] == item) {
                return true;
            }
        }
        return false;

    }

    function reset_sub_tab() {

        substituions_tab = {
            columns: [],
            drawings: [],
            substitions: []
        };

    }

    function getShortName(n) {

        //Extrait le nom du node sans la hierarchie
        split_string = n.split("/")
        return split_string[split_string.length - 1];

    }




}
