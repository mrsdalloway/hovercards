'use strict';

describe('youtube-video-button', function() {
    var sandbox = sinon.sandbox.create();
    var Squire;
    var clock;
    var trigger;
    var button;

    before(function(done) {
        require(['Squire'], function(_Squire) {
            Squire = _Squire;
            done();
        });
    });

    beforeEach(function(done) {
        var injector = new Squire();
        trigger = sandbox.spy(function trigger() {
            return $('<div></div>');
        });
        injector
            .mock('trigger', trigger)
            .require(['youtube-video-button'], function(youtubeVideoButton) {
                $('#sandbox').append('<div id="video"></div>');
                clock = sandbox.useFakeTimers();
                button = youtubeVideoButton('#video', 'VIDEO_ID').appendTo('#sandbox');
                done();
            });
    });

    afterEach(function() {
        $('#sandbox').empty();
        $('#sandbox').off();
        sandbox.restore();
    });

    it('should be transparent', function() {
        button.should.have.css('opacity', '0');
    });

    it('should have position absolute', function() {
        button.should.have.css('position', 'absolute');
    });

    it('should have inner content', function() {
        button.should.have.descendants('div');
    });

    it('should be a trigger', function() {
        trigger.should.have.been.calledOnce;
        trigger.should.have.been.calledWith(sinon.match.any, 'youtube-video', 'VIDEO_ID');
    });

    describe('when mouseenter', function() {
        beforeEach(function() {
            $('#video').offset({ top: 10, left: 11 });
            button.mouseenter();
        });

        it('should be opaque', function() {
            button.should.have.css('opacity', '1');
        });

        it('should be at the video\'s position', function() {
            button.offset().should.deep.equal($('#video').offset());
        });
    });

    describe('when mouseleave', function() {
        beforeEach(function() {
            button.mouseenter().mouseleave();
        });

        it('should be transparent', function() {
            button.should.have.css('opacity', '0');
        });
    });

    describe('when video mouseenter', function() {
        beforeEach(function() {
            $('#video').mouseenter();
        });

        it('should be opaque', function() {
            button.should.have.css('opacity', '1');
        });

        it('should fade out starting 2 seconds after', function() {
            clock.tick(2000);
            button.should.have.css('opacity', '1');
            $('#sandbox > .hovertoast-youtube-video-button:animated').should.exist;
            // TODO Detect that the animation is the one we want
        });
    });

    describe('when video mouseleave', function() {
        beforeEach(function() {
            $('#video').mouseenter().mouseleave();
        });

        it('should be transparent', function() {
            button.should.have.css('opacity', '0');
        });
    });
});
