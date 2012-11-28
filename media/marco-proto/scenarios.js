
var madrona = { 
    onShow: function(callback) { callback(); },
    setupForm: function($form) {
        $form.find('.btn-submit').hide();

        $form.closest('.panel').on('click', '.submit_button', function(e) {
            e.preventDefault();
            var $form = $(this).closest('.panel').find('form'),
                url = $form.attr('action'),
                data = {};
            
            $form.find('input,select,textarea').each( function(index, input) {
                var $input = $(input);
                data[$input.attr('name')] = $input.val();
            });

            app.viewModel.scenarios.scenarioForm(false);
            app.viewModel.scenarios.loadingMessage("Creating Scenario");
            $.ajax( {
                url: url,
                data: data,
                type: 'POST',
                dataType: 'json',
                success: function(result) {
                    app.viewModel.scenarios.addScenarioToMap(result['X-Madrona-Show']);                    
                    app.viewModel.scenarios.loadingMessage(false);
                },
                error: function() {
                    app.viewModel.scenarios.loadingMessage("Error Creating Scenario");
                }
            });
        }); 
    }
};


function scenarioModel(options) {
    var self = this;

    self.id = options.id;
    self.name = options.name;

    self.features = options.features;
    self.layer = options.layer;
    
    return self;
}


function scenariosModel(options) {
    var self = this;
    
    self.scenarioList = ko.observableArray();
    
    self.scenarioForm = ko.observable(false);
    
    // loading message for showing spinner
    // false for normal operation
    self.loadingMessage = ko.observable(false);

    self.createWindScenario = function() {
        return $.get('/features/scenario/form/', function(data) {
            self.scenarioForm(data);
        });
    }; 
    
    self.addScenarioToMap = function(scenarioId) {
        var scenario;
    
        $.ajax( {
            url: '/features/generic-links/links/geojson/' + scenarioId + '/', 
            type: 'GET',
            dataType: 'json',
            success: function(scenario) {
                var layer = new OpenLayers.Layer.Vector(
                    scenarioId,
                    {
                        projection: new OpenLayers.Projection('EPSG:3857'),
                        displayInLayerSwitcher: false,
                        styleMap: new OpenLayers.StyleMap({
                            fillColor: "#990000"
                        }),     
                        //style: OpenLayers.Feature.Vector.style['default'],
                        scenarioModel: scenario
                    }
                );
                
                layer.addFeatures(new OpenLayers.Format.GeoJSON().read(scenario));
                
                self.scenarioList.push(new scenarioModel({
                    'name': layer.name, 
                    'features': layer.features, 
                    'layer': layer
                }));
                
                //app.addVectorAttribution(layer);
                app.map.addLayer(layer); 
                
                self.scenarioForm(false);
            },
            error: function() {
                debugger;
            }
        });
        
     
    }
            
    
    self.loadScenarios = function (scenarios) {
        $.each(scenarios, function (i, scenario) {
            self.scenarioList.push(new scenarioModel({
                id: scenario.id,
                name: scenario.name
            }));
        });
    }

    return self;
}


app.viewModel.scenarios = new scenariosModel();

// load the scenarios
$.ajax({
    url: '/scenario/get_scenarios',
    type: 'GET',
    dataType: 'json',
    success: function (scenarios) {
        app.viewModel.scenarios.loadScenarios(scenarios);
    },
    error: function (result) {
        debugger;
    }
})
